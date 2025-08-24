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

type ContactHandler struct {
	db                  *database.Firebase
	notificationHandler *NotificationHandler
}

func NewContactHandler(db *database.Firebase) *ContactHandler {
	return &ContactHandler{
		db:                  db,
		notificationHandler: NewNotificationHandler(db),
	}
}

// SubmitContactMessage handles contact form submissions (public)
func (h *ContactHandler) SubmitContactMessage(c *gin.Context) {
	var message models.ContactMessage
	if err := c.ShouldBindJSON(&message); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message.ID = utils.GenerateID()
	message.Status = "new"
	message.IsRead = false
	message.CreatedAt = time.Now()

	_, err := h.db.Client.Collection("contact_messages").Doc(message.ID).Set(h.db.Context, message)
	if err != nil {
		log.Printf("Failed to save contact message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit message"})
		return
	}

	// Create notification for admin
	h.notificationHandler.CreateNotification(
		"contact",
		"New Contact Message",
		"From "+message.Name+" about: "+message.Subject,
		"Mail",
		"/contact-messages/"+message.ID,
		"admin",
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Thank you for contacting us. We'll get back to you soon!",
		"id":      message.ID,
	})
}

// GetContactMessages retrieves all contact messages (admin only)
func (h *ContactHandler) GetContactMessages(c *gin.Context) {
	status := c.Query("status")
	
	query := h.db.Client.Collection("contact_messages").OrderBy("created_at", firestore.Desc)
	
	if status != "" && status != "all" {
		query = query.Where("status", "==", status)
	}

	messages := []models.ContactMessage{}
	iter := query.Documents(h.db.Context)

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("Error fetching contact messages: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
			return
		}

		var message models.ContactMessage
		if err := doc.DataTo(&message); err != nil {
			log.Printf("Error parsing contact message: %v", err)
			continue
		}
		messages = append(messages, message)
	}

	// Get unread count
	unreadCount := 0
	unreadDocs, err := h.db.Client.Collection("contact_messages").
		Where("is_read", "==", false).
		Documents(h.db.Context).GetAll()
	if err == nil {
		unreadCount = len(unreadDocs)
	}

	c.JSON(http.StatusOK, gin.H{
		"messages":     messages,
		"unread_count": unreadCount,
		"total_count":  len(messages),
	})
}

// GetContactMessage retrieves a single contact message (admin only)
func (h *ContactHandler) GetContactMessage(c *gin.Context) {
	messageID := c.Param("id")

	doc, err := h.db.Client.Collection("contact_messages").Doc(messageID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	var message models.ContactMessage
	if err := doc.DataTo(&message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse message"})
		return
	}

	// Mark as read if not already
	if !message.IsRead {
		_, err = h.db.Client.Collection("contact_messages").Doc(messageID).Update(h.db.Context, []firestore.Update{
			{Path: "is_read", Value: true},
			{Path: "status", Value: "read"},
		})
		if err != nil {
			log.Printf("Failed to mark message as read: %v", err)
		}
	}

	c.JSON(http.StatusOK, message)
}

// UpdateContactMessage updates a contact message status or reply (admin only)
func (h *ContactHandler) UpdateContactMessage(c *gin.Context) {
	messageID := c.Param("id")

	var updateReq struct {
		Status string `json:"status"`
		Reply  string `json:"reply"`
	}

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := []firestore.Update{
		{Path: "status", Value: updateReq.Status},
	}

	if updateReq.Reply != "" {
		now := time.Now()
		updates = append(updates, 
			firestore.Update{Path: "reply", Value: updateReq.Reply},
			firestore.Update{Path: "replied_at", Value: now},
			firestore.Update{Path: "status", Value: "replied"},
		)
	}

	_, err := h.db.Client.Collection("contact_messages").Doc(messageID).Update(h.db.Context, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Message updated successfully"})
}

// DeleteContactMessage deletes a contact message (admin only)
func (h *ContactHandler) DeleteContactMessage(c *gin.Context) {
	messageID := c.Param("id")

	_, err := h.db.Client.Collection("contact_messages").Doc(messageID).Delete(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Message deleted successfully"})
}