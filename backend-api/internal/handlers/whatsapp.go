package handlers

import (
	"fmt"
	"log"
	"net/http"
	"sort"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
	"tripund-api/internal/services"
)

type WhatsAppHandler struct {
	db              *database.Firebase
	whatsappService *services.WhatsAppService
}

func NewWhatsAppHandler(db *database.Firebase, waService *services.WhatsAppService) *WhatsAppHandler {
	return &WhatsAppHandler{
		db:              db,
		whatsappService: waService,
	}
}

// Get all templates
func (h *WhatsAppHandler) GetTemplates(c *gin.Context) {
	if h.whatsappService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "WhatsApp service not available"})
		return
	}

	templates, err := h.whatsappService.GetTemplates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"templates": templates})
}

// Create new template
func (h *WhatsAppHandler) CreateTemplate(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Template creation via API not yet implemented"})
}

// Send individual message
func (h *WhatsAppHandler) SendMessage(c *gin.Context) {
	if h.whatsappService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "WhatsApp service not available"})
		return
	}

	var request struct {
		PhoneNumber string `json:"phone_number" binding:"required"`
		Message     string `json:"message"`
		Type        string `json:"type" binding:"required"` // "text" or "template"
		TemplateID  string `json:"template_id"`
		Parameters  []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"parameters"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate based on message type
	if request.Type == "text" && request.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message is required for text messages"})
		return
	}
	
	if request.Type == "template" && request.TemplateID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Template ID is required for template messages"})
		return
	}

	var message *models.WhatsAppMessage
	var err error

	if request.Type == "template" && request.TemplateID != "" {
		// Convert parameters
		parameters := make([]models.ParameterContent, len(request.Parameters))
		for i, p := range request.Parameters {
			parameters[i] = models.ParameterContent{
				Type: p.Type,
				Text: p.Text,
			}
		}
		
		message, err = h.whatsappService.SendTemplateMessage(
			request.PhoneNumber,
			request.TemplateID,
			"en_US", // Default language
			parameters,
		)
	} else {
		message, err = h.whatsappService.SendTextMessage(request.PhoneNumber, request.Message)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save outgoing message to database
	var content string
	if request.Type == "template" {
		content = fmt.Sprintf("Template: %s", request.TemplateID)
	} else {
		content = request.Message
	}
	
	outgoingMessage := map[string]interface{}{
		"id":           fmt.Sprintf("wa_msg_%d", time.Now().UnixNano()),
		"message_id":   message.MessageID,
		"phone_number": request.PhoneNumber,
		"direction":    "outgoing",
		"type":         request.Type,
		"content":      content,
		"template_id":  request.TemplateID,
		"status":       "sent",
		"timestamp":    time.Now().Format(time.RFC3339),
		"created_at":   time.Now(),
	}
	
	if _, err := h.db.Client.Collection("whatsapp_messages").Doc(outgoingMessage["id"].(string)).Set(h.db.Context, outgoingMessage); err != nil {
		log.Printf("❌ Failed to save outgoing message: %v", err)
	} else {
		log.Printf("✅ Saved outgoing message to %s", request.PhoneNumber)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Message sent successfully",
		"data":    message,
	})
}

// Send bulk messages from CSV
func (h *WhatsAppHandler) SendBulkMessages(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Bulk messaging not yet implemented"})
}

// Get all messages grouped by phone number for conversations
func (h *WhatsAppHandler) GetMessages(c *gin.Context) {
	phoneNumber := c.Query("phone_number")
	
	// Build query
	query := h.db.Client.Collection("whatsapp_messages").OrderBy("created_at", firestore.Desc).Limit(100)
	
	// Filter by phone number if provided
	if phoneNumber != "" {
		query = h.db.Client.Collection("whatsapp_messages").Where("phone_number", "==", phoneNumber).Limit(50)
	}
	
	docs, err := query.Documents(h.db.Context).GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}
	
	messages := make([]map[string]interface{}, 0)
	for _, doc := range docs {
		message := doc.Data()
		message["id"] = doc.Ref.ID
		messages = append(messages, message)
	}
	
	// Sort messages by created_at manually (newest first for conversations, oldest first for individual chats)
	sort.Slice(messages, func(i, j int) bool {
		timeI, _ := messages[i]["created_at"].(time.Time)
		timeJ, _ := messages[j]["created_at"].(time.Time)
		if phoneNumber != "" {
			// For individual conversation, oldest first
			return timeI.Before(timeJ)
		}
		// For conversation list, newest first
		return timeI.After(timeJ)
	})
	
	// If no phone number filter, group by phone number for conversation view
	if phoneNumber == "" {
		conversations := make(map[string][]map[string]interface{})
		for _, msg := range messages {
			phone, _ := msg["phone_number"].(string)
			if phone != "" {
				conversations[phone] = append(conversations[phone], msg)
			}
		}
		
		c.JSON(http.StatusOK, gin.H{
			"conversations": conversations,
			"total_messages": len(messages),
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"messages": messages,
			"phone_number": phoneNumber,
			"count": len(messages),
		})
	}
}

// Get all contacts
func (h *WhatsAppHandler) GetContacts(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Contact management not yet implemented"})
}

// Get campaigns
func (h *WhatsAppHandler) GetCampaigns(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Campaign management not yet implemented"})
}

// Webhook endpoint for receiving messages
func (h *WhatsAppHandler) Webhook(c *gin.Context) {
	// Webhook verification (GET request)
	if c.Request.Method == "GET" {
		mode := c.Query("hub.mode")
		token := c.Query("hub.verify_token")
		challenge := c.Query("hub.challenge")

		expectedToken := "tripund-wa-secret"

		if mode == "subscribe" && token == expectedToken {
			c.String(http.StatusOK, challenge)
			return
		}

		c.Status(http.StatusForbidden)
		return
	}

	// Handle webhook message (POST request) - log and process
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Printf("WhatsApp webhook parse error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}
	
	// Log the webhook content for debugging
	log.Printf("WhatsApp webhook received: %+v", body)
	
	// Check if this is a message webhook
	if entry, ok := body["entry"].([]interface{}); ok && len(entry) > 0 {
		for _, entryItem := range entry {
			if entryMap, ok := entryItem.(map[string]interface{}); ok {
				if changes, ok := entryMap["changes"].([]interface{}); ok {
					for _, change := range changes {
						if changeMap, ok := change.(map[string]interface{}); ok {
							if field, ok := changeMap["field"].(string); ok && field == "messages" {
								if value, ok := changeMap["value"].(map[string]interface{}); ok {
									// Process messages
									if messages, ok := value["messages"].([]interface{}); ok {
										for _, message := range messages {
											if msgMap, ok := message.(map[string]interface{}); ok {
												from, _ := msgMap["from"].(string)
												msgID, _ := msgMap["id"].(string)
												msgType, _ := msgMap["type"].(string)
												timestamp, _ := msgMap["timestamp"].(string)
												
												log.Printf("📱 Incoming WhatsApp message: From=%s, ID=%s, Type=%s", from, msgID, msgType)
												
												var content string
												if text, ok := msgMap["text"].(map[string]interface{}); ok {
													if body, ok := text["body"].(string); ok {
														content = body
														log.Printf("💬 Message content: %s", content)
													}
												}
												
												// Save message to database
												waMessage := map[string]interface{}{
													"id":           fmt.Sprintf("wa_msg_%d", time.Now().UnixNano()),
													"message_id":   msgID,
													"phone_number": from,
													"direction":    "incoming",
													"type":         msgType,
													"content":      content,
													"status":       "received",
													"timestamp":    timestamp,
													"created_at":   time.Now(),
												}
												
												// Save to Firestore
												if _, err := h.db.Client.Collection("whatsapp_messages").Doc(waMessage["id"].(string)).Set(h.db.Context, waMessage); err != nil {
													log.Printf("❌ Failed to save incoming message: %v", err)
												} else {
													log.Printf("✅ Saved incoming message from %s", from)
												}
											}
										}
									}
									
									// Process message statuses
									if statuses, ok := value["statuses"].([]interface{}); ok {
										for _, status := range statuses {
											if statusMap, ok := status.(map[string]interface{}); ok {
												msgID, _ := statusMap["id"].(string)
												statusValue, _ := statusMap["status"].(string)
												log.Printf("📊 Message status update: ID=%s, Status=%s", msgID, statusValue)
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

// Send OTP
func (h *WhatsAppHandler) SendOTP(c *gin.Context) {
	if h.whatsappService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "WhatsApp service not available"})
		return
	}

	var request struct {
		PhoneNumber string `json:"phone_number" binding:"required"`
		Purpose     string `json:"purpose" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate simple OTP (in production, this should be stored and validated)
	otp := "123456" // Simplified for initial deployment

	if err := h.whatsappService.SendOTP(request.PhoneNumber, otp, request.Purpose); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "OTP sent successfully",
		"expires_in": "5 minutes",
	})
}

// Verify OTP
func (h *WhatsAppHandler) VerifyOTP(c *gin.Context) {
	// Simplified verification - in production this should check against stored OTPs
	c.JSON(http.StatusOK, gin.H{
		"message": "OTP verification not yet implemented",
		"valid":   false,
	})
}