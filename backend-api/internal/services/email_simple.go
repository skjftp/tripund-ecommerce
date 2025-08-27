package services

import (
	"log"
	"os"

	"tripund-api/internal/models"
)

// SimpleEmailService is a placeholder email service until SendGrid is configured
type SimpleEmailService struct {
	fromEmail string
}

// NewSimpleEmailService creates a new simple email service
func NewSimpleEmailService() (*SimpleEmailService, error) {
	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "orders@tripundlifestyle.com"
	}

	log.Printf("SimpleEmailService initialized (placeholder until SendGrid is configured)")
	
	return &SimpleEmailService{
		fromEmail: fromEmail,
	}, nil
}

// SendOrderConfirmation logs order confirmation (placeholder)
func (s *SimpleEmailService) SendOrderConfirmation(order *models.Order) error {
	// Get email from order (either guest email or user email would be fetched separately)
	email := order.GuestEmail
	if email == "" {
		email = "customer" // Placeholder when no email is available
	}
	
	log.Printf("📧 [PLACEHOLDER] Would send order confirmation email for order %s to %s", order.ID, email)
	log.Printf("   Order Total: ₹%.2f", order.Totals.Total)
	log.Printf("   Items: %d", len(order.Items))
	// In production with SendGrid, this will actually send the email
	return nil
}

// SendShippingConfirmation logs shipping confirmation (placeholder)
func (s *SimpleEmailService) SendShippingConfirmation(order *models.Order) error {
	// Get email from order (either guest email or user email would be fetched separately)
	email := order.GuestEmail
	if email == "" {
		email = "customer" // Placeholder when no email is available
	}

	log.Printf("📧 [PLACEHOLDER] Would send shipping confirmation email for order %s to %s", order.ID, email)
	if order.Tracking != nil {
		log.Printf("   Tracking Number: %s", order.Tracking.Number)
		log.Printf("   Provider: %s", order.Tracking.Provider)
	}
	// In production with SendGrid, this will actually send the email
	return nil
}

// SendRawEmail logs raw email (placeholder)
func (s *SimpleEmailService) SendRawEmail(to, subject, htmlBody string) error {
	log.Printf("📧 [PLACEHOLDER] Would send email to %s with subject: %s", to, subject)
	// In production with SendGrid, this will actually send the email
	return nil
}

// GetFromEmail returns the configured from email
func (s *SimpleEmailService) GetFromEmail() string {
	return s.fromEmail
}