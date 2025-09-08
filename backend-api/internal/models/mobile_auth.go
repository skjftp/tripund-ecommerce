package models

import "time"

// MobileOTP stores OTP verification data
type MobileOTP struct {
	ID           string    `firestore:"id" json:"id"`
	MobileNumber string    `firestore:"mobile_number" json:"mobile_number"`
	OTP          string    `firestore:"otp" json:"otp"`
	Purpose      string    `firestore:"purpose" json:"purpose"` // login, register, password_reset
	ExpiresAt    time.Time `firestore:"expires_at" json:"expires_at"`
	IsUsed       bool      `firestore:"is_used" json:"is_used"`
	IsVerified   bool      `firestore:"is_verified" json:"is_verified"`
	Attempts     int       `firestore:"attempts" json:"attempts"`
	CreatedAt    time.Time `firestore:"created_at" json:"created_at"`
	UsedAt       time.Time `firestore:"used_at,omitempty" json:"used_at,omitempty"`
}

// MobileUser represents a user authenticated via mobile number
type MobileUser struct {
	ID           string    `firestore:"id" json:"id"`
	MobileNumber string    `firestore:"mobile_number" json:"mobile_number"`
	Name         string    `firestore:"name,omitempty" json:"name,omitempty"`
	Email        string    `firestore:"email,omitempty" json:"email,omitempty"`
	
	// Profile information
	Profile MobileUserProfile `firestore:"profile" json:"profile"`
	
	// Account settings
	IsActive     bool      `firestore:"is_active" json:"is_active"`
	IsVerified   bool      `firestore:"is_verified" json:"is_verified"`
	Role         string    `firestore:"role" json:"role"` // customer, admin
	
	// Preferences
	Preferences  Preferences `firestore:"preferences" json:"preferences"`
	
	// Tracking
	LastLoginAt  time.Time `firestore:"last_login_at" json:"last_login_at"`
	CreatedAt    time.Time `firestore:"created_at" json:"created_at"`
	UpdatedAt    time.Time `firestore:"updated_at" json:"updated_at"`
	
	// Shopping data
	Wishlist     []string  `firestore:"wishlist,omitempty" json:"wishlist,omitempty"`
	Addresses    []UserAddress `firestore:"addresses,omitempty" json:"addresses,omitempty"`
	OrderHistory []string  `firestore:"order_history,omitempty" json:"order_history,omitempty"`
}

type MobileUserProfile struct {
	FirstName    string    `firestore:"first_name,omitempty" json:"first_name,omitempty"`
	LastName     string    `firestore:"last_name,omitempty" json:"last_name,omitempty"`
	Avatar       string    `firestore:"avatar,omitempty" json:"avatar,omitempty"`
	DateOfBirth  time.Time `firestore:"date_of_birth,omitempty" json:"date_of_birth,omitempty"`
	Gender       string    `firestore:"gender,omitempty" json:"gender,omitempty"`
}

// OTP verification request/response structures
type SendOTPRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required"`
	CountryCode  string `json:"country_code" binding:"required"`
	DeliveryMethod string `json:"delivery_method" binding:"required"` // whatsapp, sms
}

type VerifyOTPRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required"`
	OTP          string `json:"otp" binding:"required"`
}

type MobileAuthResponse struct {
	Success      bool        `json:"success"`
	Message      string      `json:"message"`
	Token        string      `json:"token,omitempty"`
	User         *MobileUser `json:"user,omitempty"`
	ExpiresIn    int         `json:"expires_in,omitempty"`
	IsNewUser    bool        `json:"is_new_user,omitempty"`
}

// Profile completion for new mobile users
type CompleteProfileRequest struct {
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email,omitempty"`
	FirstName   string `json:"first_name,omitempty"`
	LastName    string `json:"last_name,omitempty"`
}