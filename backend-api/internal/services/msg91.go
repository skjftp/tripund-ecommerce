package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"tripund-api/internal/config"
)

type MSG91Service struct {
	config    *config.Config
	baseURL   string
	client    *http.Client
}

type MSG91OTPRequest struct {
	MobileNumber string `json:"mobile_number"`
	OTP          string `json:"otp"`
	TemplateID   string `json:"template_id"`
	SenderID     string `json:"sender_id"`
}

type MSG91Response struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Data    struct {
		RequestID string `json:"request_id"`
	} `json:"data"`
}

func NewMSG91Service(cfg *config.Config) *MSG91Service {
	return &MSG91Service{
		config:  cfg,
		baseURL: "https://control.msg91.com/api/v5",
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Generate OTP (6 digits)
func (m *MSG91Service) GenerateOTP() string {
	rand.Seed(time.Now().UnixNano())
	otp := ""
	for i := 0; i < 6; i++ {
		otp += fmt.Sprintf("%d", rand.Intn(10))
	}
	return otp
}

// Send OTP via MSG91
func (m *MSG91Service) SendOTP(mobileNumber, otp string) error {
	// Clean mobile number (ensure it has country code)
	cleanMobile := strings.ReplaceAll(mobileNumber, "+", "")
	cleanMobile = strings.ReplaceAll(cleanMobile, " ", "")
	
	// Ensure Indian number format
	if !strings.HasPrefix(cleanMobile, "91") && len(cleanMobile) == 10 {
		cleanMobile = "91" + cleanMobile
	}
	
	// Prepare request payload for MSG91 Template SMS API 
	// Method 1: Try template-based approach
	payload := map[string]interface{}{
		"template_id": m.config.MSG91TemplateID,
		"recipients": []map[string]interface{}{
			{
				"mobiles": cleanMobile,
				"var":     otp, // Variable for {#var#} in template
			},
		},
	}
	
	// Log template attempt
	log.Printf("Attempting MSG91 template API with Template ID: %s", m.config.MSG91TemplateID)
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal MSG91 request: %v", err)
	}
	
	// Log the request for debugging
	log.Printf("MSG91 API Request: %s", string(jsonData))
	log.Printf("MSG91 Template ID: %s, Sender: %s", m.config.MSG91TemplateID, m.config.MSG91SenderID)
	
	// Create HTTP request - using MSG91 template flow endpoint
	req, err := http.NewRequest("POST", m.baseURL+"/flow/", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create MSG91 request: %v", err)
	}
	
	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("authkey", os.Getenv("MSG91_API_KEY"))
	
	// Send request
	resp, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send MSG91 request: %v", err)
	}
	defer resp.Body.Close()
	
	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read MSG91 response: %v", err)
	}
	
	// Check response status
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("MSG91 API error (status %d): %s", resp.StatusCode, string(body))
	}
	
	// Parse response
	var response MSG91Response
	if err := json.Unmarshal(body, &response); err != nil {
		log.Printf("MSG91 response parsing failed, but SMS might be sent: %s", string(body))
		// Don't return error as SMS might still be sent
	}
	
	log.Printf("MSG91 OTP sent successfully to %s", cleanMobile)
	return nil
}

// Send OTP using alternative MSG91 endpoint (backup method)
func (m *MSG91Service) SendOTPDirect(mobileNumber, otp string) error {
	// Clean mobile number
	cleanMobile := strings.ReplaceAll(mobileNumber, "+", "")
	cleanMobile = strings.ReplaceAll(cleanMobile, " ", "")
	
	if !strings.HasPrefix(cleanMobile, "91") && len(cleanMobile) == 10 {
		cleanMobile = "91" + cleanMobile
	}
	
	// Prepare request for direct SMS API
	payload := map[string]interface{}{
		"sender":   m.config.MSG91SenderID,
		"route":    "4", // Transactional route
		"country":  "91",
		"sms": []map[string]interface{}{
			{
				"message": []map[string]interface{}{
					{
						"to": []string{cleanMobile},
						"message": fmt.Sprintf("Your OTP for TRIPUND Lifestyle verification is %s. Valid for 5 minutes. Do not share this OTP. TRIPUND LIFESTYLE", otp),
					},
				},
			},
		},
	}
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal direct SMS request: %v", err)
	}
	
	req, err := http.NewRequest("POST", m.baseURL+"/sms/", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create direct SMS request: %v", err)
	}
	
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("authkey", os.Getenv("MSG91_API_KEY"))
	
	resp, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send direct SMS: %v", err)
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read direct SMS response: %v", err)
	}
	
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Direct SMS API error (status %d): %s", resp.StatusCode, string(body))
	}
	
	log.Printf("Direct SMS OTP sent successfully to %s", cleanMobile)
	return nil
}

// Validate Indian mobile number
func (m *MSG91Service) ValidateMobileNumber(mobile string) error {
	// Clean mobile number
	cleanMobile := strings.ReplaceAll(mobile, "+", "")
	cleanMobile = strings.ReplaceAll(cleanMobile, " ", "")
	cleanMobile = strings.ReplaceAll(cleanMobile, "-", "")
	
	// Remove country code if present
	if strings.HasPrefix(cleanMobile, "91") {
		cleanMobile = cleanMobile[2:]
	}
	
	// Validate 10-digit Indian mobile number
	if len(cleanMobile) != 10 {
		return fmt.Errorf("mobile number must be 10 digits")
	}
	
	// Must start with 6, 7, 8, or 9
	firstDigit := cleanMobile[0]
	if firstDigit < '6' || firstDigit > '9' {
		return fmt.Errorf("mobile number must start with 6, 7, 8, or 9")
	}
	
	// All characters must be digits
	for _, char := range cleanMobile {
		if char < '0' || char > '9' {
			return fmt.Errorf("mobile number must contain only digits")
		}
	}
	
	return nil
}

// Format mobile number for storage (+91xxxxxxxxxx)
func (m *MSG91Service) FormatMobileNumber(mobile string) string {
	// Clean mobile number
	cleanMobile := strings.ReplaceAll(mobile, "+", "")
	cleanMobile = strings.ReplaceAll(cleanMobile, " ", "")
	cleanMobile = strings.ReplaceAll(cleanMobile, "-", "")
	
	// Remove country code if present, then add it back
	if strings.HasPrefix(cleanMobile, "91") {
		cleanMobile = cleanMobile[2:]
	}
	
	return "+91" + cleanMobile
}