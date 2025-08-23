package database

import "tripund-api/internal/models"

// Database defines the interface for database operations
type Database interface {
	// Firebase client access (for existing direct usage)
	GetClient() interface{}
	
	// Content management
	GetContentByType(contentType string) (*models.Content, error)
	UpdateContent(contentType string, content *models.Content) error
	GetAllContent() ([]models.Content, error)
	
	// FAQ management
	GetFAQs() ([]models.FAQ, error)
	CreateFAQ(faq *models.FAQ) (string, error)
	UpdateFAQ(id string, faq *models.FAQ) error
	DeleteFAQ(id string) error
	
	// Initialize default content
	InitializeDefaultContent() error
	
	// Close connection
	Close()
}