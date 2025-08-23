package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"github.com/razorpay/razorpay-go"
	"tripund-api/internal/database"
)

type PaymentHandler struct {
	db            *database.Firebase
	client        *razorpay.Client
	secret        string
	webhookSecret string
}

func NewPaymentHandler(db *database.Firebase, keyID, keySecret, webhookSecret string) *PaymentHandler {
	client := razorpay.NewClient(keyID, keySecret)
	return &PaymentHandler{
		db:            db,
		client:        client,
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
	paymentData := payload["payload"].(map[string]interface{})["payment"].(map[string]interface{})["entity"].(map[string]interface{})
	
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