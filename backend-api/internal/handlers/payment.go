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
)

type PaymentHandler struct {
	db            *database.Firebase
	client        *razorpay.Client
	keyID         string
	secret        string
	webhookSecret string
}

func NewPaymentHandler(db *database.Firebase, keyID, keySecret, webhookSecret string) *PaymentHandler {
	client := razorpay.NewClient(keyID, keySecret)
	return &PaymentHandler{
		db:            db,
		client:        client,
		keyID:         keyID,
		secret:        keySecret,
		webhookSecret: webhookSecret,
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

	// Update order payment status
	_, err := h.db.Client.Collection("orders").Doc(orderID).Update(h.db.Context, []firestore.Update{
		{Path: "payment.status", Value: "completed"},
		{Path: "payment.razorpay_payment_id", Value: paymentData["id"]},
		{Path: "payment.paid_at", Value: time.Now()},
		{Path: "status", Value: "processing"},
		{Path: "updated_at", Value: time.Now()},
	})

	return err
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
				!strings.Contains(strings.ToLower(order.Customer.Email), searchLower) &&
				!strings.Contains(strings.ToLower(order.Payment.TransactionID), searchLower) {
				continue
			}
		}

		// Convert order to payment response format
		paymentResp := map[string]interface{}{
			"id":             order.ID,
			"order_id":       order.ID,
			"order_number":   order.OrderNumber,
			"customer_name":  order.Customer.Name,
			"customer_email": order.Customer.Email,
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
