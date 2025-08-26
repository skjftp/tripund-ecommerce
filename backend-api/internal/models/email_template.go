package models

import "time"

// EmailTemplate represents an email template in the system
type EmailTemplate struct {
	ID          string                 `firestore:"id" json:"id"`
	Name        string                 `firestore:"name" json:"name"`
	Subject     string                 `firestore:"subject" json:"subject"`
	Type        string                 `firestore:"type" json:"type"` // order_confirmation, shipping_confirmation, etc.
	HTMLContent string                 `firestore:"html_content" json:"html_content"`
	Variables   []TemplateVariable     `firestore:"variables" json:"variables"`
	IsActive    bool                   `firestore:"is_active" json:"is_active"`
	IsDefault   bool                   `firestore:"is_default" json:"is_default"`
	Preview     string                 `firestore:"preview" json:"preview"`
	Category    string                 `firestore:"category" json:"category"` // transactional, promotional, etc.
	CreatedAt   time.Time              `firestore:"created_at" json:"created_at"`
	UpdatedAt   time.Time              `firestore:"updated_at" json:"updated_at"`
	Metadata    map[string]interface{} `firestore:"metadata" json:"metadata"`
}

// TemplateVariable represents a variable that can be used in the template
type TemplateVariable struct {
	Key         string `firestore:"key" json:"key"`
	Label       string `firestore:"label" json:"label"`
	Type        string `firestore:"type" json:"type"` // string, number, date, array, object
	Required    bool   `firestore:"required" json:"required"`
	DefaultValue string `firestore:"default_value" json:"default_value"`
	Description string `firestore:"description" json:"description"`
	Example     string `firestore:"example" json:"example"`
}

// EmailTemplateTest represents a test email request
type EmailTemplateTest struct {
	TemplateID string                 `json:"template_id"`
	ToEmail    string                 `json:"to_email"`
	TestData   map[string]interface{} `json:"test_data"`
}

// PredefinedTemplate represents a pre-built template
type PredefinedTemplate struct {
	ID          string             `json:"id"`
	Name        string             `json:"name"`
	Description string             `json:"description"`
	Type        string             `json:"type"`
	Thumbnail   string             `json:"thumbnail"`
	Subject     string             `json:"subject"`
	HTMLContent string             `json:"html_content"`
	Variables   []TemplateVariable `json:"variables"`
	Category    string             `json:"category"`
}