package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tripund-ecommerce/internal/database"
	"github.com/tripund-ecommerce/internal/models"
	"github.com/tripund-ecommerce/internal/services"
	"github.com/tripund-ecommerce/internal/utils"
)

type WhatsAppHandler struct {
	db             database.Database
	whatsappService *services.WhatsAppService
}

func NewWhatsAppHandler(db database.Database, waService *services.WhatsAppService) *WhatsAppHandler {
	return &WhatsAppHandler{
		db:             db,
		whatsappService: waService,
	}
}

// Get all templates
func (h *WhatsAppHandler) GetTemplates(c *gin.Context) {
	templates, err := h.whatsappService.GetTemplates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"templates": templates})
}

// Create new template
func (h *WhatsAppHandler) CreateTemplate(c *gin.Context) {
	var template models.WhatsAppTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.whatsappService.CreateTemplate(template); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save template to database
	template.ID = utils.GenerateID("tmpl")
	template.CreatedAt = time.Now()
	template.UpdatedAt = time.Now()

	if err := h.db.Create("whatsapp_templates", template.ID, &template); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save template"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Template created successfully", "template": template})
}

// Send individual message
func (h *WhatsAppHandler) SendMessage(c *gin.Context) {
	var request struct {
		PhoneNumber string `json:"phone_number" binding:"required"`
		Message     string `json:"message" binding:"required"`
		Type        string `json:"type"` // "text" or "template"
		TemplateID  string `json:"template_id,omitempty"`
		Parameters  []models.ParameterContent `json:"parameters,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var message *models.WhatsAppMessage
	var err error

	if request.Type == "template" && request.TemplateID != "" {
		message, err = h.whatsappService.SendTemplateMessage(
			request.PhoneNumber,
			request.TemplateID,
			"en_US", // Default language
			request.Parameters,
		)
	} else {
		message, err = h.whatsappService.SendTextMessage(request.PhoneNumber, request.Message)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save message to database
	if err := h.db.Create("whatsapp_messages", message.ID, message); err != nil {
		// Log error but don't fail the response since message was sent
		fmt.Printf("Failed to save message to database: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Message sent successfully",
		"data":    message,
	})
}

// Send bulk messages from CSV
func (h *WhatsAppHandler) SendBulkMessages(c *gin.Context) {
	var request struct {
		TemplateID string `json:"template_id" binding:"required"`
		CSVData    string `json:"csv_data" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse CSV data
	reader := csv.NewReader(strings.NewReader(request.CSVData))
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CSV data"})
		return
	}

	if len(records) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CSV must have header and at least one data row"})
		return
	}

	// Create campaign record
	campaign := &models.WhatsAppCampaign{
		ID:         utils.GenerateID("camp"),
		Name:       fmt.Sprintf("Bulk Campaign %s", time.Now().Format("2006-01-02 15:04")),
		TemplateID: request.TemplateID,
		Status:     "running",
		CreatedAt:  time.Now(),
	}

	// Parse header to understand CSV structure
	headers := records[0]
	phoneIndex := -1
	nameIndex := -1
	paramIndexes := make(map[string]int)

	for i, header := range headers {
		switch strings.ToLower(strings.TrimSpace(header)) {
		case "phone", "phone_number", "mobile":
			phoneIndex = i
		case "name", "customer_name":
			nameIndex = i
		default:
			// Any other column is treated as a template parameter
			paramIndexes[header] = i
		}
	}

	if phoneIndex == -1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CSV must have a 'phone_number' column"})
		return
	}

	sent := 0
	failed := 0
	recipients := make([]string, 0)

	// Process each row
	for i := 1; i < len(records); i++ {
		row := records[i]
		if len(row) <= phoneIndex {
			failed++
			continue
		}

		phoneNumber := strings.TrimSpace(row[phoneIndex])
		if phoneNumber == "" {
			failed++
			continue
		}

		recipients = append(recipients, phoneNumber)

		// Build parameters from CSV columns
		var parameters []models.ParameterContent
		for paramName, paramIndex := range paramIndexes {
			if paramIndex < len(row) && row[paramIndex] != "" {
				parameters = append(parameters, models.ParameterContent{
					Type: "text",
					Text: strings.TrimSpace(row[paramIndex]),
				})
			}
		}

		// Add name parameter if available
		if nameIndex != -1 && nameIndex < len(row) && row[nameIndex] != "" {
			parameters = append([]models.ParameterContent{{
				Type: "text",
				Text: strings.TrimSpace(row[nameIndex]),
			}}, parameters...)
		}

		// Send message
		message, err := h.whatsappService.SendTemplateMessage(
			phoneNumber,
			request.TemplateID,
			"en_US",
			parameters,
		)

		if err != nil {
			failed++
			continue
		}

		// Save message to database
		if err := h.db.Create("whatsapp_messages", message.ID, message); err != nil {
			fmt.Printf("Failed to save bulk message to database: %v\n", err)
		}

		sent++

		// Small delay to avoid rate limiting
		time.Sleep(100 * time.Millisecond)
	}

	// Update campaign
	campaign.Recipients = recipients
	campaign.Sent = sent
	campaign.Failed = failed
	campaign.Status = "completed"
	campaign.CompletedAt = time.Now()

	if err := h.db.Create("whatsapp_campaigns", campaign.ID, campaign); err != nil {
		fmt.Printf("Failed to save campaign to database: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Bulk messages processed",
		"sent":      sent,
		"failed":    failed,
		"campaign":  campaign,
	})
}

// Get all messages (with pagination)
func (h *WhatsAppHandler) GetMessages(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	phoneNumber := c.Query("phone_number")

	// Build query conditions
	conditions := make(map[string]interface{})
	if phoneNumber != "" {
		conditions["phone_number"] = phoneNumber
	}

	messages, err := h.db.List("whatsapp_messages", conditions, limit, (page-1)*limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"page":     page,
		"limit":    limit,
	})
}

// Get all contacts
func (h *WhatsAppHandler) GetContacts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	contacts, err := h.db.List("whatsapp_contacts", nil, limit, (page-1)*limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"contacts": contacts,
		"page":     page,
		"limit":    limit,
	})
}

// Get campaigns
func (h *WhatsAppHandler) GetCampaigns(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	campaigns, err := h.db.List("whatsapp_campaigns", nil, limit, (page-1)*limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"campaigns": campaigns,
		"page":      page,
		"limit":     limit,
	})
}

// Webhook endpoint for receiving messages
func (h *WhatsAppHandler) Webhook(c *gin.Context) {
	// Webhook verification (GET request)
	if c.Request.Method == "GET" {
		mode := c.Query("hub.mode")
		token := c.Query("hub.verify_token")
		challenge := c.Query("hub.challenge")

		if mode == "subscribe" && token == h.whatsappService.config.WhatsAppWebhookSecret {
			c.String(http.StatusOK, challenge)
			return
		}

		c.Status(http.StatusForbidden)
		return
	}

	// Handle webhook message (POST request)
	var webhook models.WebhookMessage
	if err := c.ShouldBindJSON(&webhook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Process the webhook
	if err := h.whatsappService.ProcessWebhookMessage(webhook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save messages and contacts to database
	for _, entry := range webhook.Entry {
		for _, change := range entry.Changes {
			// Save contacts
			for _, contact := range change.Value.Contacts {
				waContact := &models.WhatsAppContact{
					ID:          utils.GenerateID("contact"),
					PhoneNumber: contact.WAID,
					Name:        contact.Profile.Name,
					ProfileName: contact.Profile.Name,
					LastMessage: time.Now(),
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}

				// Check if contact already exists
				existing, _ := h.db.GetByField("whatsapp_contacts", "phone_number", contact.WAID)
				if existing != nil {
					// Update existing contact
					h.db.Update("whatsapp_contacts", existing.(map[string]interface{})["id"].(string), map[string]interface{}{
						"last_message": time.Now(),
						"updated_at":   time.Now(),
					})
				} else {
					// Create new contact
					h.db.Create("whatsapp_contacts", waContact.ID, waContact)
				}
			}

			// Save messages
			for _, message := range change.Value.Messages {
				waMessage := &models.WhatsAppMessage{
					ID:          utils.GenerateID("wa_msg"),
					MessageID:   message.ID,
					PhoneNumber: message.From,
					Direction:   "incoming",
					Type:        message.Type,
					Status:      "received",
					Timestamp:   time.Now(),
					CreatedAt:   time.Now(),
				}

				if message.Text != nil {
					waMessage.Content = message.Text.Body
				}

				h.db.Create("whatsapp_messages", waMessage.ID, waMessage)
			}

			// Update message statuses
			for _, status := range change.Value.Statuses {
				// Find and update the message status
				h.db.UpdateByField("whatsapp_messages", "message_id", status.ID, map[string]interface{}{
					"status": status.Status,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

// Send OTP
func (h *WhatsAppHandler) SendOTP(c *gin.Context) {
	var request struct {
		PhoneNumber string `json:"phone_number" binding:"required"`
		Purpose     string `json:"purpose" binding:"required"` // login, registration, password_reset
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate OTP
	otp := utils.GenerateOTP(6)

	// Create OTP record
	otpRecord := &models.WhatsAppOTP{
		ID:          utils.GenerateID("otp"),
		PhoneNumber: request.PhoneNumber,
		OTP:         otp,
		Purpose:     request.Purpose,
		ExpiresAt:   time.Now().Add(5 * time.Minute),
		CreatedAt:   time.Now(),
	}

	// Save OTP to database
	if err := h.db.Create("whatsapp_otps", otpRecord.ID, otpRecord); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save OTP"})
		return
	}

	// Send OTP via WhatsApp
	if err := h.whatsappService.SendOTP(request.PhoneNumber, otp, request.Purpose); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "OTP sent successfully",
		"expires_in": "5 minutes",
	})
}

// Verify OTP
func (h *WhatsAppHandler) VerifyOTP(c *gin.Context) {
	var request struct {
		PhoneNumber string `json:"phone_number" binding:"required"`
		OTP         string `json:"otp" binding:"required"`
		Purpose     string `json:"purpose" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find OTP record
	conditions := map[string]interface{}{
		"phone_number": request.PhoneNumber,
		"otp":          request.OTP,
		"purpose":      request.Purpose,
		"is_used":      false,
	}

	otps, err := h.db.List("whatsapp_otps", conditions, 1, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if len(otps) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OTP"})
		return
	}

	otpData := otps[0].(map[string]interface{})
	
	// Check expiry
	expiresAt, _ := otpData["expires_at"].(time.Time)
	if time.Now().After(expiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OTP expired"})
		return
	}

	// Mark OTP as used
	h.db.Update("whatsapp_otps", otpData["id"].(string), map[string]interface{}{
		"is_used": true,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "OTP verified successfully",
		"valid":   true,
	})
}