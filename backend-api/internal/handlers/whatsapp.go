package handlers

import (
	"net/http"

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

	c.JSON(http.StatusOK, gin.H{
		"message": "Message sent successfully",
		"data":    message,
	})
}

// Send bulk messages from CSV
func (h *WhatsAppHandler) SendBulkMessages(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Bulk messaging not yet implemented"})
}

// Get all messages
func (h *WhatsAppHandler) GetMessages(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Message history not yet implemented"})
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

	// Handle webhook message (POST request) - for now just return OK
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