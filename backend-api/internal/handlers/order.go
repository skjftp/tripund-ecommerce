package handlers

import (
	"fmt"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
	"tripund-api/internal/utils"
)

type OrderHandler struct {
	db *database.Firebase
}

func NewOrderHandler(db *database.Firebase) *OrderHandler {
	return &OrderHandler{db: db}
}

type CreateOrderRequest struct {
	FirstName   string `json:"firstName" validate:"required"`
	LastName    string `json:"lastName" validate:"required"`
	Email       string `json:"email" validate:"required,email"`
	Phone       string `json:"phone" validate:"required"`
	Address     models.UserAddress `json:"address" validate:"required"`
	Items       []OrderItemRequest `json:"items" validate:"required,min=1"`
	Totals      models.OrderTotals `json:"totals" validate:"required"`
	PaymentMethod string `json:"paymentMethod" validate:"required"`
	Notes       string `json:"notes"`
}

type OrderItemRequest struct {
	ProductID string  `json:"product_id" validate:"required"`
	Quantity  int     `json:"quantity" validate:"required,min=1"`
	Price     float64 `json:"price" validate:"required,min=0"`
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Generate order ID and number
	orderID := utils.GenerateID()
	orderNumber := fmt.Sprintf("ORD-%d-%s", time.Now().Year(), utils.GenerateOrderNumber())

	// Convert request items to order items
	var orderItems []models.OrderItem
	for _, item := range req.Items {
		// Fetch product details
		product, err := h.db.GetProductByID(item.ProductID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Product not found: %s", item.ProductID)})
			return
		}

		orderItem := models.OrderItem{
			ProductID:   item.ProductID,
			ProductName: product.Name,
			ProductImage: func() string {
				if len(product.Images) > 0 {
					return product.Images[0]
				}
				return ""
			}(),
			SKU:      product.SKU,
			Quantity: item.Quantity,
			Price:    item.Price,
			Discount: 0,
			Total:    item.Price * float64(item.Quantity),
		}
		orderItems = append(orderItems, orderItem)
	}

	// Create the order
	order := models.Order{
		ID:          orderID,
		OrderNumber: orderNumber,
		UserID:      userID.(string),
		Items:       orderItems,
		ShippingAddress: req.Address,
		BillingAddress:  req.Address, // Same as shipping for now
		Payment: models.Payment{
			Method:   req.PaymentMethod,
			Status:   "pending",
			Amount:   req.Totals.Total,
			Currency: "INR",
		},
		Totals:    req.Totals,
		Status:    "pending",
		Notes:     req.Notes,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save to Firestore
	_, err := h.db.Client.Collection("orders").Doc(orderID).Set(h.db.Context, order)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Order created successfully",
		"order": gin.H{
			"id":           order.ID,
			"order_number": order.OrderNumber,
			"total":        order.Totals.Total,
			"status":       order.Status,
		},
	})
}

func (h *OrderHandler) GetUserOrders(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	orders := make([]models.Order, 0)
	iter := h.db.Client.Collection("orders").Where("user_id", "==", userID).OrderBy("created_at", firestore.Desc).Documents(h.db.Context)
	
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
			return
		}
		
		var order models.Order
		if err := doc.DataTo(&order); err != nil {
			continue
		}
		orders = append(orders, order)
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  len(orders),
	})
}

func (h *OrderHandler) GetOrder(c *gin.Context) {
	orderID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	doc, err := h.db.Client.Collection("orders").Doc(orderID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var order models.Order
	if err := doc.DataTo(&order); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse order"})
		return
	}

	// Check if order belongs to user
	if order.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// Admin endpoints
func (h *OrderHandler) GetAllOrders(c *gin.Context) {
	orders := make([]models.Order, 0)
	iter := h.db.Client.Collection("orders").OrderBy("created_at", firestore.Desc).Documents(h.db.Context)
	
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
			return
		}
		
		var order models.Order
		if err := doc.DataTo(&order); err != nil {
			continue
		}
		orders = append(orders, order)
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  len(orders),
	})
}

func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")
	
	var req struct {
		Status string `json:"status" validate:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.db.Client.Collection("orders").Doc(orderID).Update(h.db.Context, []firestore.Update{
		{Path: "status", Value: req.Status},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order status updated successfully"})
}