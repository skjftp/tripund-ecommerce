package handlers

import (
	"bytes"
	"fmt"
	htmltemplate "html/template"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
	"tripund-api/internal/services"
	"tripund-api/internal/utils"
)

type EmailTemplateHandler struct {
	db           *database.Firebase
	emailService *services.FixedOAuth2EmailService
}

func NewEmailTemplateHandler(db *database.Firebase) *EmailTemplateHandler {
	// Initialize email service for testing
	emailService, _ := services.NewFixedOAuth2EmailService()
	
	return &EmailTemplateHandler{
		db:           db,
		emailService: emailService,
	}
}

// GetTemplates retrieves all email templates
func (h *EmailTemplateHandler) GetTemplates(c *gin.Context) {
	templateType := c.Query("type")
	
	var templates []models.EmailTemplate
	query := h.db.Client.Collection("email_templates").OrderBy("created_at", firestore.Desc)
	
	if templateType != "" {
		query = query.Where("type", "==", templateType)
	}
	
	iter := query.Documents(h.db.Context)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch templates"})
			return
		}
		
		var template models.EmailTemplate
		if err := doc.DataTo(&template); err != nil {
			continue
		}
		template.ID = doc.Ref.ID
		templates = append(templates, template)
	}
	
	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
		"total":     len(templates),
	})
}

// GetTemplate retrieves a single template by ID
func (h *EmailTemplateHandler) GetTemplate(c *gin.Context) {
	templateID := c.Param("id")
	
	doc, err := h.db.Client.Collection("email_templates").Doc(templateID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}
	
	var template models.EmailTemplate
	if err := doc.DataTo(&template); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse template"})
		return
	}
	template.ID = doc.Ref.ID
	
	c.JSON(http.StatusOK, template)
}

// CreateTemplate creates a new email template
func (h *EmailTemplateHandler) CreateTemplate(c *gin.Context) {
	var req models.EmailTemplate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	req.ID = utils.GenerateID()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	
	// If this is set as default, unset other defaults of the same type
	if req.IsDefault {
		h.unsetDefaultTemplates(req.Type)
	}
	
	_, err := h.db.Client.Collection("email_templates").Doc(req.ID).Set(h.db.Context, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template"})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{
		"message":  "Template created successfully",
		"template": req,
	})
}

// UpdateTemplate updates an existing template
func (h *EmailTemplateHandler) UpdateTemplate(c *gin.Context) {
	templateID := c.Param("id")
	
	var req models.EmailTemplate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	req.UpdatedAt = time.Now()
	
	// If this is set as default, unset other defaults of the same type
	if req.IsDefault {
		h.unsetDefaultTemplates(req.Type)
	}
	
	_, err := h.db.Client.Collection("email_templates").Doc(templateID).Set(h.db.Context, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update template"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message":  "Template updated successfully",
		"template": req,
	})
}

// DeleteTemplate deletes a template
func (h *EmailTemplateHandler) DeleteTemplate(c *gin.Context) {
	templateID := c.Param("id")
	
	// Check if template exists and is not default
	doc, err := h.db.Client.Collection("email_templates").Doc(templateID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}
	
	var template models.EmailTemplate
	doc.DataTo(&template)
	
	if template.IsDefault {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete default template"})
		return
	}
	
	_, err = h.db.Client.Collection("email_templates").Doc(templateID).Delete(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete template"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Template deleted successfully"})
}

// TestTemplate sends a test email using the template
func (h *EmailTemplateHandler) TestTemplate(c *gin.Context) {
	var req models.EmailTemplateTest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Fetch the template
	doc, err := h.db.Client.Collection("email_templates").Doc(req.TemplateID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}
	
	var template models.EmailTemplate
	if err := doc.DataTo(&template); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse template"})
		return
	}
	
	// Process the template with test data
	tmpl, err := htmltemplate.New("email").Parse(template.HTMLContent)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template syntax"})
		return
	}
	
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, req.TestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to process template"})
		return
	}
	
	// Process subject template
	subjectTmpl, err := htmltemplate.New("subject").Parse(template.Subject)
	if err == nil {
		var subjectBuf bytes.Buffer
		subjectTmpl.Execute(&subjectBuf, req.TestData)
		template.Subject = subjectBuf.String()
	}
	
	// Send test email
	if h.emailService != nil {
		err = h.emailService.SendRawEmail(req.ToEmail, template.Subject, buf.String())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to send test email: %v", err)})
			return
		}
	} else {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Email service not available"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Test email sent successfully to %s", req.ToEmail),
	})
}

// GetPredefinedTemplates returns pre-built templates
func (h *EmailTemplateHandler) GetPredefinedTemplates(c *gin.Context) {
	templates := h.getPredefinedTemplates()
	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
		"total":     len(templates),
	})
}

// SetDefaultTemplate sets a template as default for its type
func (h *EmailTemplateHandler) SetDefaultTemplate(c *gin.Context) {
	templateID := c.Param("id")
	
	// Get the template
	doc, err := h.db.Client.Collection("email_templates").Doc(templateID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}
	
	var template models.EmailTemplate
	doc.DataTo(&template)
	
	// Unset other defaults of the same type
	h.unsetDefaultTemplates(template.Type)
	
	// Set this template as default
	_, err = h.db.Client.Collection("email_templates").Doc(templateID).Update(h.db.Context, []firestore.Update{
		{Path: "is_default", Value: true},
		{Path: "updated_at", Value: time.Now()},
	})
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default template"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Template set as default successfully"})
}

// Helper function to unset default templates of a specific type
func (h *EmailTemplateHandler) unsetDefaultTemplates(templateType string) error {
	iter := h.db.Client.Collection("email_templates").
		Where("type", "==", templateType).
		Where("is_default", "==", true).
		Documents(h.db.Context)
	
	batch := h.db.Client.Batch()
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return err
		}
		
		batch.Update(doc.Ref, []firestore.Update{
			{Path: "is_default", Value: false},
		})
	}
	
	_, err := batch.Commit(h.db.Context)
	return err
}

// getPredefinedTemplates returns a list of pre-built templates
func (h *EmailTemplateHandler) getPredefinedTemplates() []models.PredefinedTemplate {
	return []models.PredefinedTemplate{
		{
			ID:          "elegant-order",
			Name:        "Elegant Order Confirmation",
			Description: "A sophisticated order confirmation template with modern design",
			Type:        "order_confirmation",
			Category:    "transactional",
			Subject:     "Order Confirmation - {{.OrderNumber}} | TRIPUND Lifestyle",
			HTMLContent: h.getElegantOrderTemplate(),
			Variables:   h.getOrderTemplateVariables(),
			Thumbnail:   "/templates/elegant-order.png",
		},
		{
			ID:          "minimal-order",
			Name:        "Minimal Order Confirmation",
			Description: "Clean and minimal order confirmation template",
			Type:        "order_confirmation",
			Category:    "transactional",
			Subject:     "Your Order {{.OrderNumber}} is Confirmed",
			HTMLContent: h.getMinimalOrderTemplate(),
			Variables:   h.getOrderTemplateVariables(),
			Thumbnail:   "/templates/minimal-order.png",
		},
		{
			ID:          "festive-order",
			Name:        "Festive Order Confirmation",
			Description: "Colorful template with Indian festive theme",
			Type:        "order_confirmation",
			Category:    "transactional",
			Subject:     "🎉 Order Confirmed - {{.OrderNumber}}",
			HTMLContent: h.getFestiveOrderTemplate(),
			Variables:   h.getOrderTemplateVariables(),
			Thumbnail:   "/templates/festive-order.png",
		},
		{
			ID:          "modern-shipping",
			Name:        "Modern Shipping Confirmation",
			Description: "Modern shipping notification with tracking emphasis",
			Type:        "shipping_confirmation",
			Category:    "transactional",
			Subject:     "📦 Your Order {{.OrderNumber}} Has Shipped!",
			HTMLContent: h.getModernShippingTemplate(),
			Variables:   h.getShippingTemplateVariables(),
			Thumbnail:   "/templates/modern-shipping.png",
		},
	}
}

// Helper to get order template variables
func (h *EmailTemplateHandler) getOrderTemplateVariables() []models.TemplateVariable {
	return []models.TemplateVariable{
		{Key: "CustomerName", Label: "Customer Name", Type: "string", Required: true, Example: "John Doe"},
		{Key: "CustomerEmail", Label: "Customer Email", Type: "string", Required: true, Example: "customer@email.com"},
		{Key: "OrderNumber", Label: "Order Number", Type: "string", Required: true, Example: "ORD-2025-123456"},
		{Key: "OrderDate", Label: "Order Date", Type: "date", Required: true, Example: "January 2, 2025"},
		{Key: "Items", Label: "Order Items", Type: "array", Required: true, Description: "Array of ordered items"},
		{Key: "Subtotal", Label: "Subtotal", Type: "number", Required: true, Example: "9999.00"},
		{Key: "Shipping", Label: "Shipping Cost", Type: "number", Required: true, Example: "100.00"},
		{Key: "Tax", Label: "Tax Amount", Type: "number", Required: true, Example: "1800.00"},
		{Key: "Total", Label: "Total Amount", Type: "number", Required: true, Example: "11899.00"},
		{Key: "ShippingAddress", Label: "Shipping Address", Type: "object", Required: true},
	}
}

// Helper to get shipping template variables
func (h *EmailTemplateHandler) getShippingTemplateVariables() []models.TemplateVariable {
	return []models.TemplateVariable{
		{Key: "CustomerName", Label: "Customer Name", Type: "string", Required: true},
		{Key: "OrderNumber", Label: "Order Number", Type: "string", Required: true},
		{Key: "TrackingNumber", Label: "Tracking Number", Type: "string", Required: true},
		{Key: "TrackingURL", Label: "Tracking URL", Type: "string", Required: false},
		{Key: "Carrier", Label: "Shipping Carrier", Type: "string", Required: true},
		{Key: "EstimatedDelivery", Label: "Estimated Delivery", Type: "string", Required: false},
		{Key: "Items", Label: "Order Items", Type: "array", Required: true},
		{Key: "ShippingAddress", Label: "Delivery Address", Type: "object", Required: true},
	}
}