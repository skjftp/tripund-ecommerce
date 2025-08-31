package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"github.com/razorpay/razorpay-go"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
	"tripund-api/internal/services"
)

type PaymentHandler struct {
	db                  *database.Firebase
	client              *razorpay.Client
	keyID               string
	secret              string
	webhookSecret       string
	notificationHandler *NotificationHandler
	emailService        *services.SendGridEmailService
}

func NewPaymentHandler(db *database.Firebase, keyID, keySecret, webhookSecret string) *PaymentHandler {
	client := razorpay.NewClient(keyID, keySecret)
	
	// Initialize email service
	emailService, err := services.NewSendGridEmailService()
	if err != nil {
		log.Printf("WARNING: Failed to initialize email service in PaymentHandler: %v", err)
	}
	
	return &PaymentHandler{
		db:                  db,
		client:              client,
		keyID:               keyID,
		secret:              keySecret,
		webhookSecret:       webhookSecret,
		notificationHandler: NewNotificationHandler(db),
		emailService:        emailService,
	}
}

type CreatePaymentOrderRequest struct {
	Amount   float64 `json:"amount" validate:"required,min=1"`
	Currency string  `json:"currency"`
	OrderID  string  `json:"order_id" validate:"required"`
}

type VerifyPaymentRequest struct {
	RazorpayOrderID   string `json:"razorpay_order_id" validate:"required"`
	RazorpayPaymentID string `json:"razorpay_payment_id" validate:"required"`
	RazorpaySignature string `json:"razorpay_signature" validate:"required"`
	OrderID           string `json:"order_id" validate:"required"`
}

func (h *PaymentHandler) CreateRazorpayOrder(c *gin.Context) {
	var req CreatePaymentOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Currency == "" {
		req.Currency = "INR"
	}

	data := map[string]interface{}{
		"amount":   int(req.Amount * 100),
		"currency": req.Currency,
		"receipt":  req.OrderID,
		"notes": map[string]string{
			"order_id": req.OrderID,
		},
	}

	order, err := h.client.Order.Create(data, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Razorpay order"})
		return
	}

	_, err = h.db.Client.Collection("orders").Doc(req.OrderID).Update(h.db.Context, []firestore.Update{
		{Path: "payment.razorpay_order_id", Value: order["id"]},
		{Path: "payment.status", Value: "pending"},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id": order["id"],
		"amount":   order["amount"],
		"currency": order["currency"],
		"key_id":   h.keyID,
	})
}

func (h *PaymentHandler) VerifyPayment(c *gin.Context) {
	var req VerifyPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	signature := h.verifySignature(req.RazorpayOrderID, req.RazorpayPaymentID, req.RazorpaySignature)
	if !signature {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment signature"})
		return
	}

	_, err := h.db.Client.Collection("orders").Doc(req.OrderID).Update(h.db.Context, []firestore.Update{
		{Path: "payment.razorpay_payment_id", Value: req.RazorpayPaymentID},
		{Path: "payment.razorpay_signature", Value: req.RazorpaySignature},
		{Path: "payment.status", Value: "completed"},
		{Path: "payment.paid_at", Value: time.Now()},
		{Path: "status", Value: "processing"},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order payment status"})
		return
	}

	// Get order details for notification
	orderDoc, _ := h.db.Client.Collection("orders").Doc(req.OrderID).Get(h.db.Context)
	var order models.Order
	orderDoc.DataTo(&order)
	
	// Create notification for payment received
	h.notificationHandler.NotifyPaymentReceived(order.OrderNumber, order.Totals.Total)

	// Auto-generate invoice, send email, and update stock after payment verification
	go func() {
		// Update stock quantities
		if err := h.updateStockForOrder(order); err != nil {
			log.Printf("Failed to update stock for order %s: %v", req.OrderID, err)
		} else {
			log.Printf("Successfully updated stock for order %s", req.OrderID)
		}
		
		// Generate invoice
		if err := h.generateInvoiceForOrder(req.OrderID); err != nil {
			log.Printf("Failed to auto-generate invoice for order %s: %v", req.OrderID, err)
		} else {
			log.Printf("Successfully auto-generated invoice for order %s", req.OrderID)
		}
		
		// Send order confirmation email
		if h.emailService != nil {
			if err := h.emailService.SendOrderConfirmation(order); err != nil {
				log.Printf("Failed to send order confirmation email for order %s: %v", req.OrderID, err)
			} else {
				log.Printf("Order confirmation email sent successfully after payment verification for order %s", req.OrderID)
			}
		} else {
			log.Printf("Email service not available for order %s", req.OrderID)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment verified successfully",
		"order_id": req.OrderID,
	})
}

func (h *PaymentHandler) verifySignature(orderID, paymentID, signature string) bool {
	data := orderID + "|" + paymentID
	mac := hmac.New(sha256.New, []byte(h.secret))
	mac.Write([]byte(data))
	expectedSig := hex.EncodeToString(mac.Sum(nil))
	return expectedSig == signature
}

func (h *PaymentHandler) RazorpayWebhook(c *gin.Context) {
	signature := c.GetHeader("X-Razorpay-Signature")
	
	// Read the raw body for signature verification
	body, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	// Verify webhook signature
	// Use webhook secret if available, otherwise fall back to API secret
	webhookSecret := h.webhookSecret
	if webhookSecret == "" {
		webhookSecret = h.secret
	}
	
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(body)
	expectedSig := hex.EncodeToString(mac.Sum(nil))
	
	if signature != expectedSig {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	// Parse the webhook payload
	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	// Log the webhook event for debugging
	log.Printf("Received Razorpay webhook: %s", string(body))

	// Handle different webhook events
	event, ok := payload["event"].(string)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event type not found"})
		return
	}

	switch event {
	case "payment.captured":
		// Payment successful
		if err := h.handlePaymentCaptured(payload); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process payment captured"})
			return
		}
	case "payment.failed":
		// Payment failed
		if err := h.handlePaymentFailed(payload); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process payment failed"})
			return
		}
	case "order.paid":
		// Order paid
		if err := h.handleOrderPaid(payload); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process order paid"})
			return
		}
	default:
		// Log other events but don't process
		log.Printf("Received webhook event: %s", event)
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *PaymentHandler) handlePaymentCaptured(payload map[string]interface{}) error {
	// Safely extract payment data with type assertions
	payloadData, ok := payload["payload"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid payload structure")
	}
	
	paymentWrapper, ok := payloadData["payment"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("payment data not found in payload")
	}
	
	paymentData, ok := paymentWrapper["entity"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("entity data not found in payment")
	}
	
	// Extract order ID from notes or description
	notes, _ := paymentData["notes"].(map[string]interface{})
	orderID, _ := notes["order_id"].(string)
	
	if orderID == "" {
		return fmt.Errorf("order ID not found in payment notes")
	}

	// Extract payment method details from Razorpay
	paymentMethod, _ := paymentData["method"].(string)
	bank, _ := paymentData["bank"].(string)
	wallet, _ := paymentData["wallet"].(string)
	
	// Update order payment status with payment method details
	_, err := h.db.Client.Collection("orders").Doc(orderID).Update(h.db.Context, []firestore.Update{
		{Path: "payment.status", Value: "completed"},
		{Path: "payment.razorpay_payment_id", Value: paymentData["id"]},
		{Path: "payment.payment_method", Value: paymentMethod},
		{Path: "payment.bank", Value: bank},
		{Path: "payment.wallet", Value: wallet},
		{Path: "payment.paid_at", Value: time.Now()},
		{Path: "status", Value: "processing"},
		{Path: "updated_at", Value: time.Now()},
	})
	if err != nil {
		return err
	}
	
	// Note: Invoice generation and email sending handled by frontend payment verification API

	return nil
}

func (h *PaymentHandler) handlePaymentFailed(payload map[string]interface{}) error {
	paymentData := payload["payload"].(map[string]interface{})["payment"].(map[string]interface{})["entity"].(map[string]interface{})
	
	notes, _ := paymentData["notes"].(map[string]interface{})
	orderID, _ := notes["order_id"].(string)
	
	if orderID == "" {
		return fmt.Errorf("order ID not found in payment notes")
	}

	// Update order payment status to failed
	_, err := h.db.Client.Collection("orders").Doc(orderID).Update(h.db.Context, []firestore.Update{
		{Path: "payment.status", Value: "failed"},
		{Path: "payment.razorpay_payment_id", Value: paymentData["id"]},
		{Path: "status", Value: "payment_failed"},
		{Path: "updated_at", Value: time.Now()},
	})

	return err
}

func (h *PaymentHandler) handleOrderPaid(payload map[string]interface{}) error {
	orderData := payload["payload"].(map[string]interface{})["order"].(map[string]interface{})["entity"].(map[string]interface{})
	
	receipt, _ := orderData["receipt"].(string)
	if receipt == "" {
		return fmt.Errorf("receipt (order ID) not found")
	}

	// Update order as paid
	_, err := h.db.Client.Collection("orders").Doc(receipt).Update(h.db.Context, []firestore.Update{
		{Path: "payment.status", Value: "completed"},
		{Path: "payment.razorpay_order_id", Value: orderData["id"]},
		{Path: "status", Value: "processing"},
		{Path: "updated_at", Value: time.Now()},
	})

	return err
}

// CreateGuestRazorpayOrder creates a Razorpay order for guest checkout
func (h *PaymentHandler) CreateGuestRazorpayOrder(c *gin.Context) {
	var req struct {
		Amount   float64 `json:"amount" binding:"required"`
		Currency string  `json:"currency"`
		OrderID  string  `json:"order_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Currency == "" {
		req.Currency = "INR"
	}

	// Create Razorpay order
	orderData := map[string]interface{}{
		"amount":   int(req.Amount * 100), // Convert to paise
		"currency": req.Currency,
		"receipt":  req.OrderID,
	}

	order, err := h.client.Order.Create(orderData, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment order"})
		return
	}

	// Update order with Razorpay order ID
	_, err = h.db.Client.Collection("orders").Doc(req.OrderID).Update(h.db.Context, []firestore.Update{
		{Path: "payment.razorpay_order_id", Value: order["id"]},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"razorpay_order_id": order["id"],
		"amount":           order["amount"],
		"currency":         order["currency"],
		"key_id":          h.keyID,
	})
}

// VerifyGuestPayment verifies payment for guest checkout
func (h *PaymentHandler) VerifyGuestPayment(c *gin.Context) {
	var req struct {
		RazorpayOrderID   string `json:"razorpay_order_id" binding:"required"`
		RazorpayPaymentID string `json:"razorpay_payment_id" binding:"required"`
		RazorpaySignature string `json:"razorpay_signature" binding:"required"`
		OrderID           string `json:"order_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify signature
	params := map[string]interface{}{
		"razorpay_order_id":   req.RazorpayOrderID,
		"razorpay_payment_id": req.RazorpayPaymentID,
		"razorpay_signature": req.RazorpaySignature,
	}

	// Verify signature manually
	signature := params["razorpay_order_id"].(string) + "|" + params["razorpay_payment_id"].(string)
	mac := hmac.New(sha256.New, []byte(h.secret))
	mac.Write([]byte(signature))
	expectedSig := hex.EncodeToString(mac.Sum(nil))
	
	if params["razorpay_signature"].(string) != expectedSig {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment signature"})
		return
	}

	// Update order status
	_, err := h.db.Client.Collection("orders").Doc(req.OrderID).Update(h.db.Context, []firestore.Update{
		{Path: "payment.status", Value: "completed"},
		{Path: "payment.transaction_id", Value: req.RazorpayPaymentID},
		{Path: "payment.razorpay_payment_id", Value: req.RazorpayPaymentID},
		{Path: "payment.razorpay_signature", Value: req.RazorpaySignature},
		{Path: "status", Value: "processing"},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	// Auto-generate invoice and send order confirmation email after guest payment verification
	go func() {
		// Get updated order
		updatedOrderDoc, err := h.db.Client.Collection("orders").Doc(req.OrderID).Get(h.db.Context)
		if err != nil {
			log.Printf("Failed to get order for post-payment processing: %v", err)
			return
		}
		
		var updatedOrder models.Order
		if err := updatedOrderDoc.DataTo(&updatedOrder); err != nil {
			log.Printf("Failed to parse order for post-payment processing: %v", err)
			return
		}
		updatedOrder.ID = updatedOrderDoc.Ref.ID
		
		// Generate invoice
		if err := h.generateInvoiceForOrder(req.OrderID); err != nil {
			log.Printf("Failed to auto-generate invoice for guest order %s: %v", req.OrderID, err)
		} else {
			log.Printf("Successfully auto-generated invoice for guest order %s", req.OrderID)
		}
		
		// Send order confirmation email
		if h.emailService != nil {
			if err := h.emailService.SendOrderConfirmation(updatedOrder); err != nil {
				log.Printf("Failed to send order confirmation email for guest order %s: %v", req.OrderID, err)
			} else {
				log.Printf("Order confirmation email sent successfully after guest payment verification for order %s", req.OrderID)
			}
		} else {
			log.Printf("Email service not available for guest order %s", req.OrderID)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment verified successfully",
		"order_id": req.OrderID,
	})
}
// GetAllPayments returns all payments for admin panel
func (h *PaymentHandler) GetAllPayments(c *gin.Context) {
	// Get query parameters for filtering
	search := c.Query("search")
	status := c.Query("status")
	method := c.Query("method")

	// Get all orders (payments are part of orders)
	docs, err := h.db.Client.Collection("orders").Documents(h.db.Context).GetAll()
	if err != nil {
		log.Printf("Error fetching payments: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}

	payments := []map[string]interface{}{}
	for _, doc := range docs {
		var order models.Order
		if err := doc.DataTo(&order); err != nil {
			log.Printf("Error parsing order %s: %v", doc.Ref.ID, err)
			continue
		}
		order.ID = doc.Ref.ID

		// Filter by payment status if provided
		if status != "" && status != "all" {
			if order.Payment.Status != status {
				continue
			}
		}

		// Filter by payment method if provided
		if method != "" && method != "all" {
			if order.Payment.Method != method {
				continue
			}
		}

		// Filter by search if provided
		if search != "" {
			searchLower := strings.ToLower(search)
			if !strings.Contains(strings.ToLower(order.OrderNumber), searchLower) &&
				!strings.Contains(strings.ToLower(order.GuestEmail), searchLower) &&
				!strings.Contains(strings.ToLower(order.Payment.TransactionID), searchLower) {
				continue
			}
		}

		// Get customer name and email
		customerName := order.GuestName
		customerEmail := order.GuestEmail
		if customerName == "" {
			customerName = "Guest User"
		}

		// Convert order to payment response format
		paymentResp := map[string]interface{}{
			"id":             order.ID,
			"order_id":       order.ID,
			"order_number":   order.OrderNumber,
			"customer_name":  customerName,
			"customer_email": customerEmail,
			"amount":         order.Totals.Total,
			"method":         order.Payment.Method,
			"status":         order.Payment.Status,
			"transaction_id": order.Payment.TransactionID,
			"created_at":     order.CreatedAt,
			"paid_at":        order.Payment.PaidAt,
		}

		payments = append(payments, paymentResp)
	}

	// Sort payments by created_at descending
	sort.Slice(payments, func(i, j int) bool {
		timeI := payments[i]["created_at"].(time.Time)
		timeJ := payments[j]["created_at"].(time.Time)
		return timeI.After(timeJ)
	})

	c.JSON(http.StatusOK, gin.H{
		"payments": payments,
		"total":    len(payments),
	})
}

// generateInvoiceForOrder creates invoice for a completed payment
func (h *PaymentHandler) generateInvoiceForOrder(orderID string) error {
	// Get order details
	orderDoc, err := h.db.Client.Collection("orders").Doc(orderID).Get(h.db.Context)
	if err != nil {
		return fmt.Errorf("order not found: %v", err)
	}

	var order models.Order
	if err := orderDoc.DataTo(&order); err != nil {
		return fmt.Errorf("failed to parse order: %v", err)
	}
	order.ID = orderDoc.Ref.ID

	// Get company settings for invoice generation
	settingsDoc, err := h.db.Client.Collection("settings").Doc("main").Get(h.db.Context)
	if err != nil {
		return fmt.Errorf("failed to fetch company settings: %v", err)
	}

	var settings map[string]interface{}
	if err := settingsDoc.DataTo(&settings); err != nil {
		return fmt.Errorf("failed to parse settings: %v", err)
	}

	// Verify invoice settings exist
	if _, ok := settings["invoice"].(map[string]interface{}); !ok {
		return fmt.Errorf("invoice settings not configured")
	}

	// Generate simple invoice number
	invoiceNumber := fmt.Sprintf("TRIPUND-%s-%s", time.Now().Format("200601"), orderID[:8])

	// Create complete invoice with all required fields
	invoice := h.createCompleteInvoice(&order, settings, invoiceNumber)

	// Save invoice to Firestore
	docRef, _, err := h.db.Client.Collection("invoices").Add(h.db.Context, invoice)
	if err != nil {
		return fmt.Errorf("failed to create invoice: %v", err)
	}

	// Update order with invoice reference
	_, err = h.db.Client.Collection("orders").Doc(orderID).Update(h.db.Context, []firestore.Update{
		{Path: "invoice_id", Value: docRef.ID},
		{Path: "updated_at", Value: time.Now()},
	})

	return err
}

// createCompleteInvoice creates a complete invoice with all required fields (copied from InvoiceHandler)
func (h *PaymentHandler) createCompleteInvoice(order *models.Order, settings map[string]interface{}, invoiceNumber string) models.Invoice {
	now := time.Now()
	dueDate := now.AddDate(0, 0, 30) // 30 days due date
	
	// Extract invoice settings
	invoiceSettings := make(map[string]interface{})
	if inv, ok := settings["invoice"].(map[string]interface{}); ok {
		invoiceSettings = inv
	}
	
	// Create seller address
	sellerAddress := models.InvoiceAddress{
		Line1:      getStringValue(invoiceSettings, "address_line1", "Office No.-509, Logix Technova, Tower-A"),
		Line2:      getStringValue(invoiceSettings, "address_line2", "Sector-132, Greater Noida"),
		City:       getStringValue(invoiceSettings, "city", "Greater Noida"),
		State:      getStringValue(invoiceSettings, "home_state", "Uttar Pradesh"),
		StateCode:  getStringValue(invoiceSettings, "home_state_code", "09"),
		PostalCode: getStringValue(invoiceSettings, "postal_code", "201310"),
		Country:    "India",
	}
	
	// Create buyer address
	buyerAddress := models.InvoiceAddress{
		Line1:      order.BillingAddress.Line1,
		Line2:      order.BillingAddress.Line2,
		City:       order.BillingAddress.City,
		State:      order.BillingAddress.State,
		StateCode:  "27", // Default for now
		PostalCode: order.BillingAddress.PostalCode,
		Country:    order.BillingAddress.Country,
	}
	
	// Create buyer details
	buyerDetails := models.BillingEntity{
		Name:    order.GuestName,
		Email:   order.GuestEmail,
		Phone:   order.GuestPhone,
		Address: buyerAddress,
		IsB2B:   false,
	}
	
	// Create line items with proper tax calculations
	var lineItems []models.InvoiceLineItem
	gstRate := 18.0
	isInterState := sellerAddress.StateCode != buyerAddress.StateCode
	
	for i, item := range order.Items {
		taxableValue := item.Price * float64(item.Quantity)
		
		lineItem := models.InvoiceLineItem{
			ID:          fmt.Sprintf("item_%d", i+1),
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			HSNCode:     "9403",
			Quantity:    float64(item.Quantity),
			UnitPrice:   item.Price,
			TaxableValue: taxableValue,
		}
		
		// Apply GST based on inter-state or intra-state
		lineItem.ApplyGST(gstRate, isInterState)
		lineItems = append(lineItems, lineItem)
	}
	
	// Payment information
	var paymentMethodDisplay string
	var transactionID string
	
	if order.Payment.Method == "razorpay" {
		transactionID = order.Payment.RazorpayPaymentID
		paymentMethodDisplay = "Online Payment"
	} else {
		paymentMethodDisplay = "Cash on Delivery"
		transactionID = "COD-" + order.OrderNumber
	}
	
	// Create complete invoice
	invoice := models.Invoice{
		InvoiceNumber: invoiceNumber,
		OrderID:       order.ID,
		UserID:        order.UserID,
		Type:          models.InvoiceTypeRegular,
		Status:        models.InvoiceStatusSent,
		
		// Seller details
		SellerName:    getStringValue(invoiceSettings, "registered_name", "TRIPUND Lifestyle"),
		SellerGSTIN:   getStringValue(invoiceSettings, "gstin", ""),
		SellerPAN:     getStringValue(invoiceSettings, "pan", ""),
		SellerAddress: sellerAddress,
		SellerEmail:   "orders@tripundlifestyle.com",
		SellerPhone:   "+91 9711441830",
		
		// Buyer details
		BuyerDetails:    buyerDetails,
		ShippingAddress: models.InvoiceAddress{
			Line1:      order.ShippingAddress.Line1,
			Line2:      order.ShippingAddress.Line2,
			City:       order.ShippingAddress.City,
			State:      order.ShippingAddress.State,
			StateCode:  "27",
			PostalCode: order.ShippingAddress.PostalCode,
			Country:    order.ShippingAddress.Country,
		},
		
		// Invoice details
		IssueDate:       now,
		DueDate:         dueDate,
		PlaceOfSupply:   order.ShippingAddress.State,
		PlaceOfDelivery: order.ShippingAddress.State,
		
		// Line items
		LineItems: lineItems,
		
		// Payment info (empty - removed as requested)
		BankDetails:     models.BankDetails{},
		PaymentTerms:    "", // Removed
		
		// Additional fields (empty - removed as requested)
		Notes:           "", // Removed
		TermsConditions: "", // Removed
		
		// System fields
		CreatedAt: now,
		UpdatedAt: now,
	}
	
	// Calculate tax summary
	invoice.CalculateTaxSummary()

	return invoice
}

// updateStockForOrder decrements stock when payment is successful
func (h *PaymentHandler) updateStockForOrder(order models.Order) error {
	// Iterate through order items and decrement stock
	for _, item := range order.Items {
		productRef := h.db.Client.Collection("products").Doc(item.ProductID)
		
		// Get current product to check stock
		productDoc, err := productRef.Get(h.db.Context)
		if err != nil {
			log.Printf("Failed to get product %s: %v", item.ProductID, err)
			continue // Skip this product but continue with others
		}

		var product models.Product
		if err := productDoc.DataTo(&product); err != nil {
			log.Printf("Failed to parse product %s: %v", item.ProductID, err)
			continue
		}

		// Check if this is a variant order
		if item.VariantID != "" && product.HasVariants {
			// Update variant stock
			variantUpdated := false
			for i, variant := range product.Variants {
				if variant.ID == item.VariantID {
					// Decrement variant stock
					newStock := variant.StockQuantity - item.Quantity
					if newStock < 0 {
						newStock = 0
					}
					product.Variants[i].StockQuantity = newStock
					
					// Update availability
					if newStock == 0 {
						product.Variants[i].Available = false
					}
					
					variantUpdated = true
					log.Printf("Updated variant stock for product %s, variant %s: new stock %d", 
						item.ProductID, item.VariantID, newStock)
					break
				}
			}
			
			if variantUpdated {
				// Update the entire product document with modified variants
				_, err = productRef.Update(h.db.Context, []firestore.Update{
					{Path: "variants", Value: product.Variants},
					{Path: "updated_at", Value: time.Now()},
				})
				
				if err != nil {
					log.Printf("Failed to update variant stock for product %s: %v", item.ProductID, err)
				}
			}
		} else {
			// Regular product without variants - update main stock
			newStock := product.StockQuantity - item.Quantity
			if newStock < 0 {
				newStock = 0 // Prevent negative stock
			}

			// Update product stock
			_, err = productRef.Update(h.db.Context, []firestore.Update{
				{Path: "stock_quantity", Value: newStock},
				{Path: "updated_at", Value: time.Now()},
			})

			if err != nil {
				log.Printf("Failed to update stock for product %s: %v", item.ProductID, err)
			} else {
				log.Printf("Updated stock for product %s: old=%d new=%d", item.ProductID, product.StockQuantity, newStock)
			}
		}
	}
	return nil
}

// getStringValue helper function (renamed to avoid conflict)
func getStringValue(m map[string]interface{}, key, defaultValue string) string {
	if val, ok := m[key].(string); ok {
		return val
	}
	return defaultValue
}
