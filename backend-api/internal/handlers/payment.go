package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"github.com/razorpay/razorpay-go"
	"tripund-api/internal/database"
)

type PaymentHandler struct {
	db     *database.Firebase
	client *razorpay.Client
	secret string
}

func NewPaymentHandler(db *database.Firebase, keyID, keySecret string) *PaymentHandler {
	client := razorpay.NewClient(keyID, keySecret)
	return &PaymentHandler{
		db:     db,
		client: client,
		secret: keySecret,
	}
}

type CreateOrderRequest struct {
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
	var req CreateOrderRequest
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
	_ = c.GetHeader("X-Razorpay-Signature")
	
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}