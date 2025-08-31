package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
)

type InvoiceHandler struct {
	db *database.Firebase
}

func NewInvoiceHandler(db *database.Firebase) *InvoiceHandler {
	return &InvoiceHandler{db: db}
}

type GenerateInvoiceRequest struct {
	OrderID string `json:"order_id" binding:"required"`
	DueDays int    `json:"due_days,omitempty"`
}

type InvoiceListRequest struct {
	UserID     string                `json:"user_id,omitempty"`
	Status     models.InvoiceStatus  `json:"status,omitempty"`
	Type       models.InvoiceType    `json:"type,omitempty"`
	StartDate  *time.Time            `json:"start_date,omitempty"`
	EndDate    *time.Time            `json:"end_date,omitempty"`
	Page       int                   `json:"page,omitempty"`
	Limit      int                   `json:"limit,omitempty"`
}

type InvoiceListResponse struct {
	Invoices []models.Invoice `json:"invoices"`
	Total    int              `json:"total"`
	Page     int              `json:"page"`
	Limit    int              `json:"limit"`
}

// Generate invoice from order
func (h *InvoiceHandler) GenerateInvoice(c *gin.Context) {
	var req GenerateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get order details
	orderDoc, err := h.db.Client.Collection("orders").Doc(req.OrderID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var order models.Order
	if err := orderDoc.DataTo(&order); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse order"})
		return
	}
	order.ID = orderDoc.Ref.ID

	// Get company settings from main settings document
	settingsDoc, err := h.db.Client.Collection("settings").Doc("main").Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company settings"})
		return
	}

	var settings map[string]interface{}
	if err := settingsDoc.DataTo(&settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse settings"})
		return
	}

	// Verify invoice settings exist
	if _, ok := settings["invoice"].(map[string]interface{}); !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invoice settings not configured"})
		return
	}

	// Generate invoice number
	invoiceNumber, err := h.generateInvoiceNumber()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate invoice number"})
		return
	}

	// Create invoice from order
	invoice := h.createInvoiceFromOrder(&order, settings, invoiceNumber, req.DueDays)

	// Save invoice to Firestore
	docRef, _, err := h.db.Client.Collection("invoices").Add(h.db.Context, invoice)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
		return
	}

	invoice.ID = docRef.ID

	// Update order with invoice reference
	h.db.Client.Collection("orders").Doc(req.OrderID).Update(h.db.Context, []firestore.Update{
		{Path: "invoice_id", Value: invoice.ID},
		{Path: "updated_at", Value: time.Now()},
	})

	c.JSON(http.StatusCreated, invoice)
}

// Get invoice by ID
func (h *InvoiceHandler) GetInvoice(c *gin.Context) {
	invoiceID := c.Param("id")
	
	doc, err := h.db.Client.Collection("invoices").Doc(invoiceID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	var invoice models.Invoice
	if err := doc.DataTo(&invoice); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse invoice"})
		return
	}
	invoice.ID = doc.Ref.ID

	// Check access permissions
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("role")
	
	if userRole != "admin" && userID != invoice.UserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, invoice)
}

// List invoices with filtering
func (h *InvoiceHandler) ListInvoices(c *gin.Context) {
	var req InvoiceListRequest
	
	// Parse query parameters
	if userID := c.Query("user_id"); userID != "" {
		req.UserID = userID
	}
	if status := c.Query("status"); status != "" {
		req.Status = models.InvoiceStatus(status)
	}
	if invoiceType := c.Query("type"); invoiceType != "" {
		req.Type = models.InvoiceType(invoiceType)
	}
	
	if page := c.Query("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil {
			req.Page = p
		}
	}
	if req.Page <= 0 {
		req.Page = 1
	}
	
	if limit := c.Query("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil {
			req.Limit = l
		}
	}
	if req.Limit <= 0 || req.Limit > 100 {
		req.Limit = 20
	}

	// Build query - removed OrderBy to avoid index requirement
	query := h.db.Client.Collection("invoices")
	
	// Apply filters
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("role")
	
	if userRole != "admin" {
		// Non-admin users can only see their own invoices
		query = query.Where("user_id", "==", userID)
	} else if req.UserID != "" {
		query = query.Where("user_id", "==", req.UserID)
	}
	
	if req.Status != "" {
		query = query.Where("status", "==", string(req.Status))
	}
	
	if req.Type != "" {
		query = query.Where("type", "==", string(req.Type))
	}

	// Get total count
	iter := query.Documents(h.db.Context)
	docs, err := iter.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch invoices",
			"details": err.Error(),
		})
		return
	}
	
	total := len(docs)
	
	// Apply pagination
	startIndex := (req.Page - 1) * req.Limit
	endIndex := startIndex + req.Limit
	
	// Handle empty results (not an error)
	if total == 0 {
		c.JSON(http.StatusOK, InvoiceListResponse{
			Invoices: []models.Invoice{},
			Total:    0,
			Page:     req.Page,
			Limit:    req.Limit,
		})
		return
	}
	
	if startIndex >= total {
		c.JSON(http.StatusOK, InvoiceListResponse{
			Invoices: []models.Invoice{},
			Total:    total,
			Page:     req.Page,
			Limit:    req.Limit,
		})
		return
	}
	
	if endIndex > total {
		endIndex = total
	}

	var invoices []models.Invoice
	for i := startIndex; i < endIndex; i++ {
		var invoice models.Invoice
		if err := docs[i].DataTo(&invoice); err != nil {
			continue
		}
		invoice.ID = docs[i].Ref.ID
		invoices = append(invoices, invoice)
	}

	c.JSON(http.StatusOK, InvoiceListResponse{
		Invoices: invoices,
		Total:    total,
		Page:     req.Page,
		Limit:    req.Limit,
	})
}

// Update invoice status
func (h *InvoiceHandler) UpdateInvoiceStatus(c *gin.Context) {
	invoiceID := c.Param("id")
	
	var req struct {
		Status models.InvoiceStatus `json:"status" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.db.Client.Collection("invoices").Doc(invoiceID).Update(h.db.Context, []firestore.Update{
		{Path: "status", Value: string(req.Status)},
		{Path: "updated_at", Value: time.Now()},
	})
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice status updated successfully"})
}

// Delete invoice (Admin only)
func (h *InvoiceHandler) DeleteInvoice(c *gin.Context) {
	invoiceID := c.Param("id")
	
	_, err := h.db.Client.Collection("invoices").Doc(invoiceID).Delete(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice deleted successfully"})
}

// Get invoice statistics (Admin only)
func (h *InvoiceHandler) GetInvoiceStats(c *gin.Context) {
	iter := h.db.Client.Collection("invoices").Documents(h.db.Context)
	docs, err := iter.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoice statistics"})
		return
	}

	stats := map[string]interface{}{
		"total_invoices": len(docs),
		"by_status":      make(map[string]int),
		"by_type":        make(map[string]int),
		"total_amount":   0.0,
		"pending_amount": 0.0,
	}

	statusCounts := make(map[string]int)
	typeCounts := make(map[string]int)
	var totalAmount, pendingAmount float64

	for _, doc := range docs {
		var invoice models.Invoice
		if err := doc.DataTo(&invoice); err != nil {
			continue
		}

		statusCounts[string(invoice.Status)]++
		typeCounts[string(invoice.Type)]++
		totalAmount += invoice.TaxSummary.FinalAmount
		
		if invoice.Status == models.InvoiceStatusSent || invoice.Status == models.InvoiceStatusOverdue {
			pendingAmount += invoice.TaxSummary.FinalAmount
		}
	}

	stats["by_status"] = statusCounts
	stats["by_type"] = typeCounts
	stats["total_amount"] = totalAmount
	stats["pending_amount"] = pendingAmount

	c.JSON(http.StatusOK, stats)
}

// Helper functions
func (h *InvoiceHandler) generateInvoiceNumber() (string, error) {
	// Get current year and month
	now := time.Now()
	yearMonth := now.Format("200601") // YYYYMM format
	
	// Get last invoice number for current month
	prefix := fmt.Sprintf("TRIPUND-%s-", yearMonth)
	
	iter := h.db.Client.Collection("invoices").
		Where("invoice_number", ">=", prefix).
		Where("invoice_number", "<", prefix+"Z").
		OrderBy("invoice_number", firestore.Desc).
		Limit(1).
		Documents(h.db.Context)
	
	docs, err := iter.GetAll()
	if err != nil {
		return "", err
	}
	
	var lastNumber int = 0
	if len(docs) > 0 {
		var invoice models.Invoice
		if err := docs[0].DataTo(&invoice); err == nil {
			// Extract number from invoice number (format: TRIPUND-YYYYMM-NNNN)
			if len(invoice.InvoiceNumber) > len(prefix) {
				numberStr := invoice.InvoiceNumber[len(prefix):]
				if num, err := strconv.Atoi(numberStr); err == nil {
					lastNumber = num
				}
			}
		}
	}
	
	newNumber := lastNumber + 1
	return fmt.Sprintf("%s%04d", prefix, newNumber), nil
}

func (h *InvoiceHandler) createInvoiceFromOrder(order *models.Order, settings map[string]interface{}, invoiceNumber string, dueDays int) models.Invoice {
	now := time.Now()
	dueDate := now.AddDate(0, 0, dueDays)
	if dueDays == 0 {
		dueDate = now.AddDate(0, 0, 30) // Default 30 days
	}

	// Extract invoice settings
	invoiceSettings := make(map[string]interface{})
	if inv, ok := settings["invoice"].(map[string]interface{}); ok {
		invoiceSettings = inv
	}

	// Create seller address
	sellerAddress := models.InvoiceAddress{
		Line1:      getString(invoiceSettings, "address_line1", "TRIPUND LIFESTYLE PRIVATE LIMITED"),
		Line2:      getString(invoiceSettings, "address_line2", ""),
		City:       getString(invoiceSettings, "city", "Mumbai"),
		State:      getString(invoiceSettings, "home_state", "Maharashtra"),
		StateCode:  getString(invoiceSettings, "home_state_code", "27"),
		PostalCode: getString(invoiceSettings, "postal_code", "400001"),
		Country:    "India",
	}

	// Create buyer details
	buyerAddress := models.InvoiceAddress{
		Line1:      order.ShippingAddress.Line1,
		Line2:      order.ShippingAddress.Line2,
		City:       order.ShippingAddress.City,
		State:      order.ShippingAddress.State,
		StateCode:  getStateCode(order.ShippingAddress.State),
		PostalCode: order.ShippingAddress.PostalCode,
		Country:    order.ShippingAddress.Country,
	}

	buyerDetails := models.BillingEntity{
		Name:    order.GuestName, // Use GuestName from order
		Email:   order.GuestEmail,
		Phone:   order.GuestPhone, // Use GuestPhone from order
		Address: buyerAddress,
		IsB2B:   false, // Default to B2C unless GSTIN provided
	}

	// Create bank details
	bankDetails := models.BankDetails{
		AccountName:   getString(invoiceSettings, "bank_account_name", "TRIPUND LIFESTYLE PRIVATE LIMITED"),
		AccountNumber: getString(invoiceSettings, "bank_account_number", ""),
		IFSCCode:      getString(invoiceSettings, "bank_ifsc", ""),
		BankName:      getString(invoiceSettings, "bank_name", ""),
		BranchName:    getString(invoiceSettings, "bank_branch", ""),
	}

	// Create line items
	var lineItems []models.InvoiceLineItem
	gstRate := 18.0 // Default GST rate
	isInterState := sellerAddress.StateCode != buyerAddress.StateCode

	for i, item := range order.Items {
		taxableValue := item.Price * float64(item.Quantity)
		
		lineItem := models.InvoiceLineItem{
			ID:          fmt.Sprintf("item_%d", i+1),
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			HSNCode:     "9403", // Default HSN code for handicrafts
			Quantity:    float64(item.Quantity),
			UnitPrice:   item.Price,
			TaxableValue: taxableValue,
		}

		// Apply GST
		lineItem.ApplyGST(gstRate, isInterState)
		lineItems = append(lineItems, lineItem)
	}

	invoice := models.Invoice{
		InvoiceNumber:   invoiceNumber,
		OrderID:        order.ID,
		UserID:         order.UserID,
		Type:           models.InvoiceTypeRegular,
		Status:         models.InvoiceStatusSent,
		
		// Seller details
		SellerName:     getString(invoiceSettings, "registered_name", "TRIPUND LIFESTYLE PRIVATE LIMITED"),
		SellerGSTIN:    getString(invoiceSettings, "gstin", ""),
		SellerPAN:      getString(invoiceSettings, "pan", ""),
		SellerAddress:  sellerAddress,
		SellerEmail:    getString(invoiceSettings, "email", "orders@tripundlifestyle.com"),
		SellerPhone:    getString(invoiceSettings, "phone", "+91 9876543210"),
		
		// Buyer details
		BuyerDetails:    buyerDetails,
		ShippingAddress: buyerAddress,
		
		// Invoice details
		IssueDate:      now,
		DueDate:        dueDate,
		PlaceOfSupply:  buyerAddress.State,
		PlaceOfDelivery: buyerAddress.State,
		
		// Line items
		LineItems: lineItems,
		
		// Payment info
		BankDetails:     bankDetails,
		PaymentTerms:    fmt.Sprintf("Payment due within %d days", dueDays),
		
		// Additional fields
		Notes:           "Thank you for your business!",
		TermsConditions: getString(invoiceSettings, "terms_conditions", "Standard terms and conditions apply."),
		
		// System fields
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Calculate tax summary
	invoice.CalculateTaxSummary()

	return invoice
}

// Helper function to safely extract string from map
func getString(m map[string]interface{}, key, defaultValue string) string {
	if value, ok := m[key].(string); ok && value != "" {
		return value
	}
	return defaultValue
}

// Helper function to get state code
func getStateCode(state string) string {
	stateCodes := map[string]string{
		"Andhra Pradesh":         "37",
		"Arunachal Pradesh":      "12",
		"Assam":                  "18",
		"Bihar":                  "10",
		"Chhattisgarh":          "22",
		"Goa":                   "30",
		"Gujarat":               "24",
		"Haryana":               "06",
		"Himachal Pradesh":      "02",
		"Jharkhand":             "20",
		"Karnataka":             "29",
		"Kerala":                "32",
		"Madhya Pradesh":        "23",
		"Maharashtra":           "27",
		"Manipur":               "14",
		"Meghalaya":             "17",
		"Mizoram":               "15",
		"Nagaland":              "13",
		"Odisha":                "21",
		"Punjab":                "03",
		"Rajasthan":             "08",
		"Sikkim":                "11",
		"Tamil Nadu":            "33",
		"Telangana":             "36",
		"Tripura":               "16",
		"Uttar Pradesh":         "09",
		"Uttarakhand":           "05",
		"West Bengal":           "19",
		"Delhi":                 "07",
		"Jammu and Kashmir":     "01",
		"Ladakh":                "38",
		"Chandigarh":            "04",
		"Dadra and Nagar Haveli and Daman and Diu": "26",
		"Lakshadweep":           "31",
		"Puducherry":            "34",
		"Andaman and Nicobar Islands": "35",
	}
	
	if code, ok := stateCodes[state]; ok {
		return code
	}
	return "99" // Default unknown state code
}

// Bulk generate invoices for existing orders without invoices
func (h *InvoiceHandler) BulkGenerateInvoices(c *gin.Context) {
	// Get all completed orders
	iter := h.db.Client.Collection("orders").Where("status", "==", "completed").Documents(h.db.Context)
	orderDocs, err := iter.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	if len(orderDocs) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": "No completed orders found",
			"generated": 0,
		})
		return
	}

	// Get existing invoices to check which orders already have invoices
	invoicesIter := h.db.Client.Collection("invoices").Documents(h.db.Context)
	invoiceDocs, err := invoicesIter.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch existing invoices"})
		return
	}

	existingOrderIds := make(map[string]bool)
	for _, doc := range invoiceDocs {
		var invoice models.Invoice
		if err := doc.DataTo(&invoice); err == nil {
			existingOrderIds[invoice.OrderID] = true
		}
	}

	// Get company settings
	settingsDoc, err := h.db.Client.Collection("settings").Doc("company").Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company settings"})
		return
	}

	var settings map[string]interface{}
	if err := settingsDoc.DataTo(&settings); err != nil {
		settings = make(map[string]interface{})
	}

	// Process orders that don't have invoices
	var generatedCount int
	batch := h.db.Client.Batch()
	batchSize := 0
	maxBatchSize := 400 // Safe limit for Firestore batch operations

	for _, orderDoc := range orderDocs {
		orderID := orderDoc.Ref.ID
		
		// Skip if invoice already exists
		if existingOrderIds[orderID] {
			continue
		}

		var order models.Order
		if err := orderDoc.DataTo(&order); err != nil {
			continue
		}
		order.ID = orderID

		// Generate invoice number
		invoiceNumber, err := h.generateInvoiceNumber()
		if err != nil {
			continue
		}

		// Create invoice from order
		invoice := h.createInvoiceFromOrder(&order, settings, invoiceNumber, 30)

		// Add to batch
		invoiceRef := h.db.Client.Collection("invoices").NewDoc()
		batch.Set(invoiceRef, invoice)

		// Update order with invoice reference
		orderRef := h.db.Client.Collection("orders").Doc(orderID)
		batch.Update(orderRef, []firestore.Update{
			{Path: "invoice_id", Value: invoiceRef.ID},
			{Path: "updated_at", Value: time.Now()},
		})

		generatedCount++
		batchSize += 2 // Each invoice involves 2 operations (create invoice + update order)

		// Commit batch when approaching Firestore limits
		if batchSize >= maxBatchSize {
			if _, err := batch.Commit(h.db.Context); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": fmt.Sprintf("Failed to commit batch at %d invoices", generatedCount),
				})
				return
			}
			
			// Reset batch
			batch = h.db.Client.Batch()
			batchSize = 0
		}
	}

	// Commit remaining operations
	if batchSize > 0 {
		if _, err := batch.Commit(h.db.Context); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to commit final batch",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Successfully generated %d invoices for existing orders", generatedCount),
		"generated": generatedCount,
		"total_orders": len(orderDocs),
		"existing_invoices": len(existingOrderIds),
	})
}