package handlers

import (
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
	"tripund-api/internal/services"
	"tripund-api/internal/utils"
)

type OrderHandler struct {
	db                   *database.Firebase
	notificationHandler  *NotificationHandler
	emailService         *services.SendGridEmailService
	whatsappService      *services.WhatsAppService
}

func NewOrderHandler(db *database.Firebase, whatsappService *services.WhatsAppService) *OrderHandler {
	// Initialize SendGrid email service
	log.Printf("Initializing SendGrid email service...")
	emailService, err := services.NewSendGridEmailService()
	if err != nil {
		log.Printf("WARNING: Failed to initialize SendGrid email service: %v", err)
		emailService = nil // Will disable email sending but not break the app
	} else {
		log.Printf("SendGrid email service initialized successfully")
	}
	
	return &OrderHandler{
		db:                  db,
		notificationHandler: NewNotificationHandler(db),
		whatsappService:     whatsappService,
		emailService:        emailService,
	}
}

type CreateOrderRequest struct {
	Name        string `json:"name" validate:"required"`
	Email       string `json:"email" validate:"required,email"`
	Phone       string `json:"phone" validate:"required"`
	Address     models.UserAddress `json:"address" validate:"required"`
	Items       []OrderItemRequest `json:"items" validate:"required,min=1"`
	Totals      models.OrderTotals `json:"totals" validate:"required"`
	PaymentMethod string `json:"paymentMethod" validate:"required"`
	Notes       string `json:"notes"`
}

type OrderItemRequest struct {
	ProductID    string  `json:"product_id" validate:"required"`
	Quantity     int     `json:"quantity" validate:"required,min=1"`
	Price        float64 `json:"price" validate:"required,min=0"`
	VariantID    string  `json:"variant_id,omitempty"`
	VariantColor string  `json:"variant_color,omitempty"`
	VariantSize  string  `json:"variant_size,omitempty"`
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

		// If variant is specified, use variant SKU
		sku := product.SKU
		if item.VariantID != "" {
			// Find the variant and use its SKU
			for _, v := range product.Variants {
				if v.ID == item.VariantID {
					sku = v.SKU
					break
				}
			}
		}

		orderItem := models.OrderItem{
			ProductID:    item.ProductID,
			ProductName:  product.Name,
			ProductImage: func() string {
				if len(product.Images) > 0 {
					return product.Images[0]
				}
				return ""
			}(),
			SKU:          sku,
			Quantity:     item.Quantity,
			Price:        item.Price,
			Discount:     0,
			Total:        item.Price * float64(item.Quantity),
			VariantID:    item.VariantID,
			VariantColor: item.VariantColor,
			VariantSize:  item.VariantSize,
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

	// Create notification for new order
	h.notificationHandler.NotifyNewOrder(orderID, orderNumber, req.Totals.Total)

	// Note: Order confirmation email will be sent after payment confirmation

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
	
	// Try without OrderBy first to avoid index requirements
	docs, err := h.db.Client.Collection("orders").Where("user_id", "==", userID.(string)).Documents(h.db.Context).GetAll()
	if err != nil {
		log.Printf("Error fetching orders for user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	
	for _, doc := range docs {
		var order models.Order
		if err := doc.DataTo(&order); err != nil {
			log.Printf("Error parsing order document %s: %v", doc.Ref.ID, err)
			continue
		}
		order.ID = doc.Ref.ID
		orders = append(orders, order)
	}
	
	// Sort orders by created_at in memory
	sort.Slice(orders, func(i, j int) bool {
		return orders[i].CreatedAt.After(orders[j].CreatedAt)
	})

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  len(orders),
	})
}

// GetGuestOrders retrieves orders for guest users by email
func (h *OrderHandler) GetGuestOrders(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	orders := make([]models.Order, 0)
	
	// Fetch orders by guest email
	docs, err := h.db.Client.Collection("orders").Where("guest_email", "==", email).Documents(h.db.Context).GetAll()
	if err != nil {
		log.Printf("Error fetching guest orders for email %s: %v", email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	
	for _, doc := range docs {
		var order models.Order
		if err := doc.DataTo(&order); err != nil {
			log.Printf("Error parsing order document %s: %v", doc.Ref.ID, err)
			continue
		}
		order.ID = doc.Ref.ID
		orders = append(orders, order)
	}
	
	// Sort orders by created_at in memory
	sort.Slice(orders, func(i, j int) bool {
		return orders[i].CreatedAt.After(orders[j].CreatedAt)
	})

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
		order.ID = doc.Ref.ID
		
		// For logged-in users, populate customer information from user profile
		if order.UserID != "" && order.UserID != "guest" {
			userDoc, err := h.db.Client.Collection("mobile_users").Doc(order.UserID).Get(h.db.Context)
			if err == nil {
				var user struct {
					Email   string `firestore:"email"`
					Profile struct {
						FirstName string `firestore:"first_name"`
						LastName  string `firestore:"last_name"`
						Phone     string `firestore:"phone"`
					} `firestore:"profile"`
				}
				if userDoc.DataTo(&user) == nil {
					// Override guest fields with actual user data
					// Build name from profile or use existing
					fullName := strings.TrimSpace(user.Profile.FirstName + " " + user.Profile.LastName)
					if fullName != "" {
						order.GuestName = fullName
					}
					order.GuestEmail = user.Email
					order.GuestPhone = user.Profile.Phone
				}
			}
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
		Status      string `json:"status" validate:"required"`
		TrackingURL string `json:"tracking_url,omitempty"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get the order first to check current status and get items
	orderDoc, err := h.db.Client.Collection("orders").Doc(orderID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var order models.Order
	if err := orderDoc.DataTo(&order); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse order"})
		return
	}

	// If changing status to "shipped", decrement product/variant stock
	if req.Status == "shipped" && order.Status != "shipped" {
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
						log.Printf("Updated variant stock for product %s, variant %s (color: %s, size: %s): %d -> %d", 
							item.ProductID, item.VariantID, item.VariantColor, item.VariantSize, 
							variant.StockQuantity, newStock)
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
					log.Printf("Updated stock for product %s: %d -> %d", item.ProductID, product.StockQuantity, newStock)
				}
			}
		}
	}

	// Prepare updates
	updates := []firestore.Update{
		{Path: "status", Value: req.Status},
		{Path: "updated_at", Value: time.Now()},
	}
	
	// Add tracking URL if provided (for shipped status)
	if req.Status == "shipped" && req.TrackingURL != "" {
		updates = append(updates, firestore.Update{
			Path: "tracking", 
			Value: map[string]interface{}{
				"url":        req.TrackingURL,
				"shipped_at": time.Now(),
				"status":     "shipped",
			},
		})
		log.Printf("Adding tracking URL for order %s: %s", orderID, req.TrackingURL)
	}
	
	// Update order status
	_, err = h.db.Client.Collection("orders").Doc(orderID).Update(h.db.Context, updates)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	message := "Order status updated successfully"
	if req.Status == "shipped" && order.Status != "shipped" {
		message = "Order marked as shipped and product stock updated"
		
		// Send shipping confirmation email and WhatsApp
		go func() {
			if h.emailService != nil {
				if err := h.emailService.SendShippingConfirmation(order); err != nil {
					log.Printf("Failed to send shipping confirmation email for order %s: %v", orderID, err)
				} else {
					log.Printf("Shipping confirmation email sent successfully for order %s", orderID)
				}
			} else {
				log.Printf("Email service not available, skipping shipping confirmation email for order %s", orderID)
			}
			
			// Send WhatsApp shipping confirmation
			if h.whatsappService != nil {
				customerName := "Customer"
				
				// Get customer name - priority: registered user > guest name > fallback
				if order.UserID != "" {
					// Fetch user details from users collection
					userDoc, userErr := h.db.Client.Collection("mobile_users").Doc(order.UserID).Get(h.db.Context)
					if userErr == nil {
						var user map[string]interface{}
						if userDoc.DataTo(&user) == nil {
							// Check for profile nested object (new structure)
							if profile, ok := user["profile"].(map[string]interface{}); ok {
								firstName, _ := profile["first_name"].(string)
								lastName, _ := profile["last_name"].(string)
								if firstName != "" {
									customerName = firstName
									if lastName != "" {
										customerName = firstName + " " + lastName
									}
								}
							} else {
								// Fallback to root level (old structure)
								firstName, _ := user["first_name"].(string)
								lastName, _ := user["last_name"].(string)
								if firstName != "" {
									customerName = firstName
									if lastName != "" {
										customerName = firstName + " " + lastName
									}
								}
							}
							// Final fallback to email if no name found
							if customerName == "Customer" {
								if email, ok := user["email"].(string); ok && email != "" {
									customerName = email
								}
							}
						}
					}
				} else if order.GuestName != "" {
					customerName = order.GuestName
				}
				
				// Get phone number - priority: guest_phone > billing > shipping
				phoneNumber := order.GuestPhone
				if phoneNumber == "" {
					phoneNumber = order.BillingAddress.Phone
				}
				if phoneNumber == "" {
					phoneNumber = order.ShippingAddress.Phone
				}
				
				trackingURL := req.TrackingURL
				if trackingURL == "" {
					trackingURL = fmt.Sprintf("https://tripundlifestyle.com/orders")
				}
				
				if phoneNumber != "" {
					if err := h.whatsappService.SendShippingConfirmation(
						phoneNumber,
						customerName,
						order.OrderNumber,
						trackingURL,
					); err != nil {
						log.Printf("Failed to send WhatsApp shipping confirmation for order %s: %v", orderID, err)
					} else {
						log.Printf("WhatsApp shipping confirmation sent successfully for order %s to %s", orderID, customerName)
					}
				} else {
					log.Printf("No phone number available for WhatsApp shipping notification for order %s", orderID)
				}
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{"message": message})
}

// GetTrackingRedirect redirects to the actual tracking URL for an order
func (h *OrderHandler) GetTrackingRedirect(c *gin.Context) {
	orderNumber := c.Param("orderNumber")
	
	// Find order by order number
	iter := h.db.Client.Collection("orders").Where("order_number", "==", orderNumber).Documents(h.db.Context)
	defer iter.Stop()
	
	doc, err := iter.Next()
	if err != nil {
		// If order not found, redirect to general orders page
		c.Redirect(http.StatusFound, "https://tripundlifestyle.com/orders")
		return
	}
	
	var order models.Order
	if err := doc.DataTo(&order); err != nil {
		c.Redirect(http.StatusFound, "https://tripundlifestyle.com/orders")
		return
	}
	
	// Check if order has tracking URL
	if order.Tracking != nil && order.Tracking.URL != "" {
		// Redirect to the actual tracking URL provided by admin
		c.Redirect(http.StatusFound, order.Tracking.URL)
		return
	}
	
	// Fallback: redirect to customer's order page
	c.Redirect(http.StatusFound, "https://tripundlifestyle.com/orders")
}

// CreateGuestOrder creates an order for guest users (no authentication required)
func (h *OrderHandler) CreateGuestOrder(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

		// If variant is specified, use variant SKU
		sku := product.SKU
		if item.VariantID != "" {
			// Find the variant and use its SKU
			for _, v := range product.Variants {
				if v.ID == item.VariantID {
					sku = v.SKU
					break
				}
			}
		}

		orderItem := models.OrderItem{
			ProductID:    item.ProductID,
			ProductName:  product.Name,
			ProductImage: func() string {
				if len(product.Images) > 0 {
					return product.Images[0]
				}
				return ""
			}(),
			SKU:          sku,
			Quantity:     item.Quantity,
			Price:        item.Price,
			Discount:     0,
			Total:        item.Price * float64(item.Quantity),
			VariantID:    item.VariantID,
			VariantColor: item.VariantColor,
			VariantSize:  item.VariantSize,
		}
		orderItems = append(orderItems, orderItem)
	}

	// Create the order with guest information
	order := models.Order{
		ID:          orderID,
		OrderNumber: orderNumber,
		UserID:      "guest", // Mark as guest order
		GuestEmail:  req.Email,
		GuestName:   req.Name,
		GuestPhone:  req.Phone,
		Items:       orderItems,
		ShippingAddress: req.Address,
		BillingAddress:  req.Address,
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

	// Create notification for new guest order
	h.notificationHandler.NotifyNewOrder(orderID, orderNumber, req.Totals.Total)

	// Note: Order confirmation email will be sent after payment confirmation

	c.JSON(http.StatusOK, gin.H{
		"message": "Order created successfully",
		"order":   order,
	})
}

// GetGuestOrder retrieves a guest order by ID (requires order ID and email verification)
func (h *OrderHandler) GetGuestOrder(c *gin.Context) {
	orderID := c.Param("id")
	email := c.Query("email")

	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required for guest order lookup"})
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

	// Verify the email matches for guest orders
	if order.UserID == "guest" && order.GuestEmail != email {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email for this order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"order": order})
}