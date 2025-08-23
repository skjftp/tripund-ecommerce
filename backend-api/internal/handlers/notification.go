package handlers

import (
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
	"tripund-api/internal/utils"
)

type NotificationHandler struct {
	db *database.Firebase
}

func NewNotificationHandler(db *database.Firebase) *NotificationHandler {
	return &NotificationHandler{db: db}
}

// CreateNotification creates a new notification (internal helper)
func (h *NotificationHandler) CreateNotification(notifType, title, message, icon, link, userID string) error {
	notification := models.Notification{
		ID:        utils.GenerateID(),
		Type:      notifType,
		Title:     title,
		Message:   message,
		Icon:      icon,
		Link:      link,
		IsRead:    false,
		UserID:    userID,
		CreatedAt: time.Now(),
	}

	_, err := h.db.Client.Collection("notifications").Doc(notification.ID).Set(h.db.Context, notification)
	return err
}

// GetNotifications retrieves notifications for admin
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	// Get query parameters
	limit := 50
	onlyUnread := c.Query("unread") == "true"

	// Build query
	query := h.db.Client.Collection("notifications").
		Where("user_id", "==", "admin").
		OrderBy("created_at", firestore.Desc)

	if onlyUnread {
		query = query.Where("is_read", "==", false)
	}

	query = query.Limit(limit)

	notifications := []models.Notification{}
	iter := query.Documents(h.db.Context)

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("Error fetching notifications: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
			return
		}

		var notification models.Notification
		if err := doc.DataTo(&notification); err != nil {
			log.Printf("Error parsing notification: %v", err)
			continue
		}
		notifications = append(notifications, notification)
	}

	// Get unread count
	unreadCount := 0
	unreadQuery := h.db.Client.Collection("notifications").
		Where("user_id", "==", "admin").
		Where("is_read", "==", false)
	
	unreadDocs, err := unreadQuery.Documents(h.db.Context).GetAll()
	if err == nil {
		unreadCount = len(unreadDocs)
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"unread_count":  unreadCount,
		"total_count":   len(notifications),
	})
}

// MarkAsRead marks a notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	notificationID := c.Param("id")

	_, err := h.db.Client.Collection("notifications").Doc(notificationID).Update(h.db.Context, []firestore.Update{
		{Path: "is_read", Value: true},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// MarkAllAsRead marks all notifications as read
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	// Get all unread notifications for admin
	docs, err := h.db.Client.Collection("notifications").
		Where("user_id", "==", "admin").
		Where("is_read", "==", false).
		Documents(h.db.Context).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	// Update each notification
	batch := h.db.Client.Batch()
	for _, doc := range docs {
		batch.Update(doc.Ref, []firestore.Update{
			{Path: "is_read", Value: true},
		})
	}

	_, err = batch.Commit(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "All notifications marked as read",
		"count":   len(docs),
	})
}

// DeleteNotification deletes a notification
func (h *NotificationHandler) DeleteNotification(c *gin.Context) {
	notificationID := c.Param("id")

	_, err := h.db.Client.Collection("notifications").Doc(notificationID).Delete(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted"})
}

// ClearAllNotifications clears all notifications for admin
func (h *NotificationHandler) ClearAllNotifications(c *gin.Context) {
	// Get all notifications for admin
	docs, err := h.db.Client.Collection("notifications").
		Where("user_id", "==", "admin").
		Documents(h.db.Context).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	// Delete each notification
	batch := h.db.Client.Batch()
	for _, doc := range docs {
		batch.Delete(doc.Ref)
	}

	_, err = batch.Commit(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "All notifications cleared",
		"count":   len(docs),
	})
}

// Helper functions to create specific notification types

func (h *NotificationHandler) NotifyNewOrder(orderID, orderNumber string, amount float64) {
	h.CreateNotification(
		"order",
		"New Order Received",
		"Order #"+orderNumber+" for ₹"+utils.FormatCurrency(amount)+" has been placed",
		"ShoppingBag",
		"/orders/"+orderID,
		"admin",
	)
}

func (h *NotificationHandler) NotifyPaymentReceived(orderNumber string, amount float64) {
	h.CreateNotification(
		"payment",
		"Payment Received",
		"Payment of ₹"+utils.FormatCurrency(amount)+" received for order #"+orderNumber,
		"CreditCard",
		"/payments",
		"admin",
	)
}

func (h *NotificationHandler) NotifyNewUser(userName, userEmail string) {
	h.CreateNotification(
		"user",
		"New User Registration",
		userName+" ("+userEmail+") has registered",
		"UserPlus",
		"/customers",
		"admin",
	)
}

func (h *NotificationHandler) NotifyLowStock(productName string, currentStock int) {
	h.CreateNotification(
		"product",
		"Low Stock Alert",
		productName+" has only "+string(currentStock)+" items left in stock",
		"AlertCircle",
		"/products",
		"admin",
	)
}