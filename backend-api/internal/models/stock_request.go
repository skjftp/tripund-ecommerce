package models

import "time"

// StockRequest represents a customer request for out-of-stock products
type StockRequest struct {
	ID            string    `firestore:"id" json:"id"`
	ProductID     string    `firestore:"product_id" json:"product_id"`
	ProductSKU    string    `firestore:"product_sku" json:"product_sku"`
	ProductName   string    `firestore:"product_name" json:"product_name"`
	ProductImage  string    `firestore:"product_image,omitempty" json:"product_image,omitempty"`
	
	// User Information
	UserID        string    `firestore:"user_id,omitempty" json:"user_id,omitempty"`
	UserName      string    `firestore:"user_name" json:"user_name"`
	UserEmail     string    `firestore:"user_email,omitempty" json:"user_email,omitempty"`
	UserPhone     string    `firestore:"user_phone" json:"user_phone"`
	
	// Variant Information (if applicable)
	VariantColor  string    `firestore:"variant_color,omitempty" json:"variant_color,omitempty"`
	VariantSize   string    `firestore:"variant_size,omitempty" json:"variant_size,omitempty"`
	
	// Request Details
	Quantity      int       `firestore:"quantity" json:"quantity"`
	MaxPrice      float64   `firestore:"max_price,omitempty" json:"max_price,omitempty"`
	Notes         string    `firestore:"notes,omitempty" json:"notes,omitempty"`
	
	// Status and Tracking
	Status        string    `firestore:"status" json:"status"` // pending, contacted, fulfilled, cancelled
	Priority      int       `firestore:"priority" json:"priority"` // 1-5 (5 being highest)
	AdminNotes    string    `firestore:"admin_notes,omitempty" json:"admin_notes,omitempty"`
	
	// Timestamps
	RequestedAt   time.Time `firestore:"requested_at" json:"requested_at"`
	ContactedAt   time.Time `firestore:"contacted_at,omitempty" json:"contacted_at,omitempty"`
	FulfilledAt   time.Time `firestore:"fulfilled_at,omitempty" json:"fulfilled_at,omitempty"`
	CreatedAt     time.Time `firestore:"created_at" json:"created_at"`
	UpdatedAt     time.Time `firestore:"updated_at" json:"updated_at"`
}

// StockRequestSummary for admin dashboard
type StockRequestSummary struct {
	ProductID      string    `json:"product_id"`
	ProductName    string    `json:"product_name"`
	ProductSKU     string    `json:"product_sku"`
	ProductImage   string    `json:"product_image"`
	TotalRequests  int       `json:"total_requests"`
	PendingCount   int       `json:"pending_count"`
	LatestRequest  time.Time `json:"latest_request"`
	RequestDetails []StockRequestDetail `json:"request_details"`
}

type StockRequestDetail struct {
	ID           string    `json:"id"`
	UserName     string    `json:"user_name"`
	UserPhone    string    `json:"user_phone"`
	UserEmail    string    `json:"user_email"`
	Quantity     int       `json:"quantity"`
	VariantColor string    `json:"variant_color,omitempty"`
	VariantSize  string    `json:"variant_size,omitempty"`
	RequestedAt  time.Time `json:"requested_at"`
	Status       string    `json:"status"`
}

// Stock request creation request
type CreateStockRequestRequest struct {
	ProductID    string  `json:"product_id" binding:"required"`
	Quantity     int     `json:"quantity" binding:"required,min=1"`
	VariantColor string  `json:"variant_color,omitempty"`
	VariantSize  string  `json:"variant_size,omitempty"`
	MaxPrice     float64 `json:"max_price,omitempty"`
	Notes        string  `json:"notes,omitempty"`
}

// Admin response for stock requests
type AdminStockRequestResponse struct {
	TotalRequests    int                    `json:"total_requests"`
	PendingRequests  int                    `json:"pending_requests"`
	ProductSummaries []StockRequestSummary  `json:"product_summaries"`
	RecentRequests   []StockRequest        `json:"recent_requests"`
}