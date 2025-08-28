package models

import "time"

type User struct {
	ID           string      `json:"id" firestore:"id"`
	Email        string      `json:"email" firestore:"email" validate:"required,email"`
	PasswordHash string      `json:"-" firestore:"password_hash"`
	Profile      UserProfile `json:"profile" firestore:"profile"`
	Addresses    []UserAddress   `json:"addresses" firestore:"addresses"`
	Cart         []CartItem  `json:"cart" firestore:"cart"`
	Preferences  Preferences `json:"preferences" firestore:"preferences"`
	Wishlist     []string    `json:"wishlist" firestore:"wishlist"`
	OrderHistory []string    `json:"order_history" firestore:"order_history"`
	Role         string      `json:"role" firestore:"role"`
	CreatedAt    time.Time   `json:"created_at" firestore:"created_at"`
	LastLoginAt  time.Time   `json:"last_login_at" firestore:"last_login_at"`
}

type UserProfile struct {
	FirstName string `json:"first_name" firestore:"first_name"`
	LastName  string `json:"last_name" firestore:"last_name"`
	Phone     string `json:"phone" firestore:"phone"`
	Avatar    string `json:"avatar" firestore:"avatar"`
}

type UserAddress struct {
	ID        string `json:"id" firestore:"id"`
	Type      string `json:"type" firestore:"type"`
	Line1     string `json:"line1" firestore:"line1" validate:"required"`
	Line2     string `json:"line2" firestore:"line2"`
	City      string `json:"city" firestore:"city" validate:"required"`
	State     string `json:"state" firestore:"state" validate:"required"`
	PostalCode string `json:"postal_code" firestore:"postal_code" validate:"required"`
	Country   string `json:"country" firestore:"country" validate:"required"`
	Phone     string `json:"phone" firestore:"phone"`
	IsDefault bool   `json:"is_default" firestore:"is_default"`
}

type CartItem struct {
	ProductID string  `json:"product_id" firestore:"product_id"`
	Name      string  `json:"name" firestore:"name"`
	Image     string  `json:"image" firestore:"image"`
	Quantity  int     `json:"quantity" firestore:"quantity"`
	Price     float64 `json:"price" firestore:"price"`
	VariantID string  `json:"variant_id,omitempty" firestore:"variant_id,omitempty"`
	Color     string  `json:"color,omitempty" firestore:"color,omitempty"`
	Size      string  `json:"size,omitempty" firestore:"size,omitempty"`
}


type Preferences struct {
	Newsletter       bool     `json:"newsletter" firestore:"newsletter"`
	EmailNotifications bool   `json:"email_notifications" firestore:"email_notifications"`
	SMSNotifications bool     `json:"sms_notifications" firestore:"sms_notifications"`
	Language         string   `json:"language" firestore:"language"`
	Currency         string   `json:"currency" firestore:"currency"`
	Categories       []string `json:"categories" firestore:"categories"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=6"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
	Phone     string `json:"phone"`
}

type AuthResponse struct {
	Token     string `json:"token"`
	ExpiresIn int64  `json:"expires_in"`
	User      User   `json:"user"`
}