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
	
	// Auto-generate invoice and send order confirmation email for successful payment
	go func() {
		// Generate invoice
		if err := h.generateInvoiceForOrder(orderID); err != nil {
			log.Printf("Failed to auto-generate invoice for order %s: %v", orderID, err)
		} else {
			log.Printf("Successfully auto-generated invoice for order %s", orderID)
		}
		
		// Send order confirmation email after payment
		if h.emailService != nil {
			// Get updated order with payment details
			updatedOrderDoc, err := h.db.Client.Collection("orders").Doc(orderID).Get(h.db.Context)
			if err != nil {
				log.Printf("Failed to get order for confirmation email: %v", err)
				return
			}
			
			var updatedOrder models.Order
			if err := updatedOrderDoc.DataTo(&updatedOrder); err != nil {
				log.Printf("Failed to parse order for confirmation email: %v", err)
				return
			}
			updatedOrder.ID = updatedOrderDoc.Ref.ID
			
			// Send confirmation email using SendGrid service
			if err := h.emailService.SendOrderConfirmation(updatedOrder); err != nil {
				log.Printf("Failed to send order confirmation email for order %s: %v", orderID, err)
			} else {
				log.Printf("Order confirmation email sent successfully after payment for order %s", orderID)
			}
		} else {
			log.Printf("Email service not available, skipping order confirmation email for order %s", orderID)
		}
	}()

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

	// Create invoice from order (reuse logic from invoice handler)
	invoice := h.createInvoiceFromOrderData(&order, settings, invoiceNumber, 30)

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

// createInvoiceFromOrderData creates invoice (simplified version of invoice handler logic)
func (h *PaymentHandler) createInvoiceFromOrderData(order *models.Order, settings map[string]interface{}, invoiceNumber string, dueDays int) map[string]interface{} {
	now := time.Now()
	dueDate := now.AddDate(0, 0, dueDays)
	
	// Extract invoice settings
	invoiceSettings := make(map[string]interface{})
	if inv, ok := settings["invoice"].(map[string]interface{}); ok {
		invoiceSettings = inv
	}
	
	// Payment information from order
	var paymentMethodDisplay string
	var transactionID string
	
	if order.Payment.Method == "razorpay" {
		transactionID = order.Payment.RazorpayPaymentID
		switch order.Payment.PaymentMethod {
		case "card":
			paymentMethodDisplay = "Credit/Debit Card"
		case "upi":
			paymentMethodDisplay = "UPI"
		case "netbanking":
			paymentMethodDisplay = "Net Banking"
		case "wallet":
			paymentMethodDisplay = "Wallet"
		default:
			paymentMethodDisplay = "Online Payment"
		}
		if order.Payment.Bank != "" {
			paymentMethodDisplay += " (" + order.Payment.Bank + ")"
		}
	} else if order.Payment.Method == "cod" {
		paymentMethodDisplay = "Cash on Delivery"
		transactionID = "COD-" + order.OrderNumber
	} else {
		paymentMethodDisplay = "Online Payment"
		transactionID = order.Payment.TransactionID
	}
	
	// Create simplified invoice data
	return map[string]interface{}{
		"invoice_number": invoiceNumber,
		"order_id":       order.ID,
		"user_id":        order.UserID,
		"type":           "regular",
		"status":         "sent",
		"seller_name":    getStringValue(invoiceSettings, "registered_name", "TRIPUND Lifestyle"),
		"seller_gstin":   getStringValue(invoiceSettings, "gstin", ""),
		"seller_pan":     getStringValue(invoiceSettings, "pan", ""),
		"issue_date":     now,
		"due_date":       dueDate,
		"payment_terms":  "Payment Method: " + paymentMethodDisplay,
		"notes":          "Transaction ID: " + transactionID,
		"terms_conditions": "Thank you for shopping with us.",
		"created_at":     now,
		"updated_at":     now,
	}
}

// getStringValue helper function (renamed to avoid conflict)
func getStringValue(m map[string]interface{}, key, defaultValue string) string {
	if val, ok := m[key].(string); ok {
		return val
	}
	return defaultValue
}
