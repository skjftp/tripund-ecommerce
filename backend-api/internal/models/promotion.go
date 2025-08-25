package models

import (
	"time"
)

type PromotionType string

const (
	PromotionTypePercentage PromotionType = "percentage"
	PromotionTypeFixed      PromotionType = "fixed"
)

type PromotionStatus string

const (
	PromotionStatusActive   PromotionStatus = "active"
	PromotionStatusInactive PromotionStatus = "inactive"
	PromotionStatusExpired  PromotionStatus = "expired"
)

type Promotion struct {
	ID          string          `json:"id" firestore:"id,omitempty"`
	Code        string          `json:"code" firestore:"code"`
	Description string          `json:"description" firestore:"description"`
	Type        PromotionType   `json:"type" firestore:"type"`
	Discount    float64         `json:"discount" firestore:"discount"`
	Status      PromotionStatus `json:"status" firestore:"status"`
	
	// Usage limits
	MaxUses        int `json:"max_uses" firestore:"max_uses"`
	UsedCount      int `json:"used_count" firestore:"used_count"`
	MaxUsesPerUser int `json:"max_uses_per_user" firestore:"max_uses_per_user"`
	
	// Conditions
	MinOrderValue float64 `json:"min_order_value" firestore:"min_order_value"`
	MaxDiscount   float64 `json:"max_discount" firestore:"max_discount"`
	
	// Validity
	StartDate time.Time `json:"start_date" firestore:"start_date"`
	EndDate   time.Time `json:"end_date" firestore:"end_date"`
	
	// User restrictions
	NewCustomersOnly bool     `json:"new_customers_only" firestore:"new_customers_only"`
	AllowedUserIds   []string `json:"allowed_user_ids" firestore:"allowed_user_ids"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at" firestore:"created_at"`
	UpdatedAt time.Time `json:"updated_at" firestore:"updated_at"`
	CreatedBy string    `json:"created_by" firestore:"created_by"`
}

type PromotionUsage struct {
	ID           string    `json:"id" firestore:"id,omitempty"`
	PromotionID  string    `json:"promotion_id" firestore:"promotion_id"`
	UserID       string    `json:"user_id" firestore:"user_id"`
	OrderID      string    `json:"order_id" firestore:"order_id"`
	DiscountApplied float64 `json:"discount_applied" firestore:"discount_applied"`
	UsedAt       time.Time `json:"used_at" firestore:"used_at"`
}