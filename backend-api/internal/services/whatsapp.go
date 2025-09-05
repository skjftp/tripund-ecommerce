package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"tripund-api/internal/config"
	"tripund-api/internal/models"
)

type WhatsAppService struct {
	config        *config.Config
	baseURL       string
	phoneNumberID string
}

func NewWhatsAppService(cfg *config.Config) *WhatsAppService {
	return &WhatsAppService{
		config:        cfg,
		baseURL:       "https://graph.facebook.com/v18.0",
		phoneNumberID: cfg.WhatsAppPhoneNumberID,
	}
}

// Initialize service and fetch Phone Number ID if not set
func (w *WhatsAppService) Initialize() error {
	if w.phoneNumberID == "" {
		phoneID, err := w.getPhoneNumberID()
		if err != nil {
			return fmt.Errorf("failed to get phone number ID: %v", err)
		}
		w.phoneNumberID = phoneID
		log.Printf("WhatsApp Phone Number ID: %s", phoneID)
	}
	return nil
}

// Get Phone Number ID from business account
func (w *WhatsAppService) getPhoneNumberID() (string, error) {
	url := fmt.Sprintf("%s/%s/phone_numbers", w.baseURL, w.config.WhatsAppBusinessID)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", w.config.WhatsAppAccessToken))
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	
	var result struct {
		Data []struct {
			ID                     string `json:"id"`
			DisplayPhoneNumber     string `json:"display_phone_number"`
			VerifiedName          string `json:"verified_name"`
			QualityRating         string `json:"quality_rating"`
		} `json:"data"`
	}
	
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}
	
	if len(result.Data) == 0 {
		return "", fmt.Errorf("no phone numbers found for business account")
	}
	
	// Return the first phone number ID (assuming single phone number)
	return result.Data[0].ID, nil
}

// Send text message
func (w *WhatsAppService) SendTextMessage(phoneNumber, message string) (*models.WhatsAppMessage, error) {
	// Clean phone number (remove +, spaces, etc.)
	cleanPhone := strings.ReplaceAll(strings.ReplaceAll(phoneNumber, "+", ""), " ", "")
	
	requestBody := models.SendMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               cleanPhone,
		Type:             "text",
		Text: &models.TextContent{
			PreviewURL: false,
			Body:       message,
		},
	}
	
	return w.sendMessage(requestBody)
}

// Send template message
func (w *WhatsAppService) SendTemplateMessage(phoneNumber, templateName, languageCode string, parameters []models.ParameterContent) (*models.WhatsAppMessage, error) {
	cleanPhone := strings.ReplaceAll(strings.ReplaceAll(phoneNumber, "+", ""), " ", "")
	
	templateContent := &models.TemplateContent{
		Name: templateName,
		Language: models.LanguageContent{
			Code: languageCode,
		},
	}
	
	if len(parameters) > 0 {
		templateContent.Components = []models.ComponentContent{
			{
				Type:       "body",
				Parameters: parameters,
			},
		}
	}
	
	requestBody := models.SendMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               cleanPhone,
		Type:             "template",
		Template:         templateContent,
	}
	
	return w.sendMessage(requestBody)
}

// Send message helper
func (w *WhatsAppService) sendMessage(requestBody models.SendMessageRequest) (*models.WhatsAppMessage, error) {
	url := fmt.Sprintf("%s/%s/messages", w.baseURL, w.phoneNumberID)
	
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", w.config.WhatsAppAccessToken))
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("WhatsApp API error: %s", string(body))
	}
	
	var result struct {
		Messages []struct {
			ID string `json:"id"`
		} `json:"messages"`
	}
	
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}
	
	if len(result.Messages) == 0 {
		return nil, fmt.Errorf("no message ID returned from WhatsApp API")
	}
	
	// Create message record
	message := &models.WhatsAppMessage{
		ID:          generateID("wa_msg"),
		MessageID:   result.Messages[0].ID,
		PhoneNumber: requestBody.To,
		Direction:   "outgoing",
		Type:        requestBody.Type,
		Status:      "sent",
		Timestamp:   time.Now(),
		CreatedAt:   time.Now(),
	}
	
	if requestBody.Text != nil {
		message.Content = requestBody.Text.Body
	} else if requestBody.Template != nil {
		message.Content = fmt.Sprintf("Template: %s", requestBody.Template.Name)
		message.TemplateID = requestBody.Template.Name
	}
	
	return message, nil
}

// Get all message templates
func (w *WhatsAppService) GetTemplates() ([]models.WhatsAppTemplate, error) {
	url := fmt.Sprintf("%s/%s/message_templates", w.baseURL, w.config.WhatsAppBusinessID)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", w.config.WhatsAppAccessToken))
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("WhatsApp API error: %s", string(body))
	}
	
	var result struct {
		Data []struct {
			ID         string `json:"id"`
			Name       string `json:"name"`
			Language   string `json:"language"`
			Status     string `json:"status"`
			Category   string `json:"category"`
			Components []struct {
				Type       string `json:"type"`
				Text       string `json:"text,omitempty"`
				Format     string `json:"format,omitempty"`
				Buttons    []struct {
					Type string `json:"type"`
					Text string `json:"text"`
					URL  string `json:"url,omitempty"`
				} `json:"buttons,omitempty"`
			} `json:"components"`
		} `json:"data"`
	}
	
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}
	
	templates := make([]models.WhatsAppTemplate, len(result.Data))
	for i, tmpl := range result.Data {
		components := make([]models.TemplateComponent, len(tmpl.Components))
		for j, comp := range tmpl.Components {
			buttons := make([]models.TemplateButton, len(comp.Buttons))
			for k, btn := range comp.Buttons {
				buttons[k] = models.TemplateButton{
					Type: btn.Type,
					Text: btn.Text,
					URL:  btn.URL,
				}
			}
			
			components[j] = models.TemplateComponent{
				Type:    comp.Type,
				Text:    comp.Text,
				Format:  comp.Format,
				Buttons: buttons,
			}
		}
		
		templates[i] = models.WhatsAppTemplate{
			ID:         tmpl.ID,
			Name:       tmpl.Name,
			Language:   tmpl.Language,
			Status:     tmpl.Status,
			Category:   tmpl.Category,
			Components: components,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
	}
	
	return templates, nil
}

// Create a new template
func (w *WhatsAppService) CreateTemplate(template models.WhatsAppTemplate) error {
	url := fmt.Sprintf("%s/%s/message_templates", w.baseURL, w.config.WhatsAppBusinessID)
	
	// Convert internal template to API format
	apiTemplate := struct {
		Name       string `json:"name"`
		Language   string `json:"language"`
		Category   string `json:"category"`
		Components []struct {
			Type    string `json:"type"`
			Text    string `json:"text,omitempty"`
			Format  string `json:"format,omitempty"`
			Buttons []struct {
				Type string `json:"type"`
				Text string `json:"text"`
				URL  string `json:"url,omitempty"`
			} `json:"buttons,omitempty"`
		} `json:"components"`
	}{
		Name:     template.Name,
		Language: template.Language,
		Category: template.Category,
	}
	
	for _, comp := range template.Components {
		apiComp := struct {
			Type    string `json:"type"`
			Text    string `json:"text,omitempty"`
			Format  string `json:"format,omitempty"`
			Buttons []struct {
				Type string `json:"type"`
				Text string `json:"text"`
				URL  string `json:"url,omitempty"`
			} `json:"buttons,omitempty"`
		}{
			Type:   comp.Type,
			Text:   comp.Text,
			Format: comp.Format,
		}
		
		for _, btn := range comp.Buttons {
			apiComp.Buttons = append(apiComp.Buttons, struct {
				Type string `json:"type"`
				Text string `json:"text"`
				URL  string `json:"url,omitempty"`
			}{
				Type: btn.Type,
				Text: btn.Text,
				URL:  btn.URL,
			})
		}
		
		apiTemplate.Components = append(apiTemplate.Components, apiComp)
	}
	
	jsonData, err := json.Marshal(apiTemplate)
	if err != nil {
		return err
	}
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", w.config.WhatsAppAccessToken))
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("WhatsApp API error: %s", string(body))
	}
	
	return nil
}

// Send OTP via WhatsApp
func (w *WhatsAppService) SendOTP(phoneNumber, otp, purpose string) error {
	var message string
	switch purpose {
	case "login":
		message = fmt.Sprintf("Your TRIPUND login OTP is: %s. Valid for 5 minutes. Do not share with anyone.", otp)
	case "registration":
		message = fmt.Sprintf("Welcome to TRIPUND! Your registration OTP is: %s. Valid for 5 minutes.", otp)
	case "password_reset":
		message = fmt.Sprintf("Your TRIPUND password reset OTP is: %s. Valid for 5 minutes. Do not share with anyone.", otp)
	default:
		message = fmt.Sprintf("Your TRIPUND verification code is: %s", otp)
	}
	
	_, err := w.SendTextMessage(phoneNumber, message)
	return err
}

// Send order confirmation using approved template
func (w *WhatsAppService) SendOrderConfirmation(phoneNumber, customerName, orderID, amount string, items []string) error {
	// Ensure phone number has +91 prefix for India
	cleanPhone := strings.ReplaceAll(strings.ReplaceAll(phoneNumber, "+", ""), " ", "")
	if !strings.HasPrefix(cleanPhone, "91") {
		cleanPhone = "91" + cleanPhone
	}
	
	// Use the approved order_management_1 template
	templateContent := &models.TemplateContent{
		Name: "order_management_1",
		Language: models.LanguageContent{
			Code: "en_US",
		},
		Components: []models.ComponentContent{
			{
				Type: "body",
				Parameters: []models.ParameterContent{
					{Type: "text", Text: customerName},
					{Type: "text", Text: orderID},
					{Type: "text", Text: "3-7 business days"}, // Standard delivery time
				},
			},
		},
	}
	
	requestBody := models.SendMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               cleanPhone,
		Type:             "template",
		Template:         templateContent,
	}
	
	_, err := w.sendMessage(requestBody)
	if err != nil {
		log.Printf("Failed to send WhatsApp order confirmation to %s: %v", phoneNumber, err)
		return err
	}
	
	log.Printf("WhatsApp order confirmation sent successfully to %s using template order_management_1", phoneNumber)
	
	// TODO: Save outgoing message to database here if needed
	// This would require database access in the service
	
	return nil
}

// Send shipping confirmation using approved template shipping_v1
func (w *WhatsAppService) SendShippingConfirmation(phoneNumber, customerName, orderID, trackingURL string) error {
	// Ensure phone number has +91 prefix for India
	cleanPhone := strings.ReplaceAll(strings.ReplaceAll(phoneNumber, "+", ""), " ", "")
	if !strings.HasPrefix(cleanPhone, "91") {
		cleanPhone = "91" + cleanPhone
	}
	
	// Prepare button URL parameter - use tracking URL if provided, otherwise orders page
	buttonURL := trackingURL
	if buttonURL == "" || buttonURL == "https://tripundlifestyle.netlify.app/orders" {
		buttonURL = "https://tripundlifestyle.com/orders"
	}
	
	// Use the approved shipping_v2 template
	templateContent := &models.TemplateContent{
		Name: "shipping_v2",
		Language: models.LanguageContent{
			Code: "en_US",
		},
		Components: []models.ComponentContent{
			{
				Type: "body",
				Parameters: []models.ParameterContent{
					{Type: "text", Text: customerName},
					{Type: "text", Text: orderID},
				},
			},
			{
				Type: "button",
				SubType: "url",
				Index: "0",
				Parameters: []models.ParameterContent{
					{Type: "text", Text: orderID}, // This will replace {{1}} in the URL
				},
			},
		},
	}
	
	// If tracking URL is provided, add it as a button parameter
	// Note: The template button URL pattern is https://www.example.com/{{1}}
	// We need to replace this with the actual tracking URL
	// For now, the template will use the default button since we can't dynamically change button URLs
	
	requestBody := models.SendMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               cleanPhone,
		Type:             "template",
		Template:         templateContent,
	}
	
	_, err := w.sendMessage(requestBody)
	if err != nil {
		log.Printf("Failed to send WhatsApp shipping confirmation to %s: %v", phoneNumber, err)
		return err
	}
	
	log.Printf("WhatsApp shipping confirmation sent successfully to %s using template shipping_v1", phoneNumber)
	
	// Also send tracking URL as a separate text message if provided
	if trackingURL != "" && trackingURL != "https://tripundlifestyle.netlify.app/orders" {
		trackingMessage := fmt.Sprintf("📦 Track your shipment here: %s", trackingURL)
		_, textErr := w.SendTextMessage(phoneNumber, trackingMessage)
		if textErr != nil {
			log.Printf("Failed to send tracking URL to %s: %v", phoneNumber, textErr)
		} else {
			log.Printf("Tracking URL sent successfully to %s", phoneNumber)
		}
	}
	
	return nil
}

// Helper function to generate IDs
func generateID(prefix string) string {
	return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
}

// Verify webhook signature
func (w *WhatsAppService) VerifyWebhookSignature(signature, body string) bool {
	// Implementation for webhook signature verification
	// This would use HMAC SHA256 with the webhook secret
	return true // Simplified for now
}

// Process webhook message
func (w *WhatsAppService) ProcessWebhookMessage(webhook models.WebhookMessage) error {
	for _, entry := range webhook.Entry {
		for _, change := range entry.Changes {
			if change.Field == "messages" {
				for _, message := range change.Value.Messages {
					// Save incoming message
					waMessage := &models.WhatsAppMessage{
						ID:          generateID("wa_msg"),
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
					
					// Here you would save to database
					log.Printf("Received WhatsApp message: %+v", waMessage)
				}
			}
			
			// Handle status updates
			if change.Field == "messages" {
				for _, status := range change.Value.Statuses {
					// Update message status in database
					log.Printf("Message status update: %s -> %s", status.ID, status.Status)
				}
			}
		}
	}
	
	return nil
}

