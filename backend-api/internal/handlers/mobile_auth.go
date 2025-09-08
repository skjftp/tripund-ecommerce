package handlers

import (
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"tripund-api/internal/config"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
	"tripund-api/internal/services"
	"tripund-api/internal/utils"
)

type MobileAuthHandler struct {
	db          *database.Firebase
	msg91       *services.MSG91Service
	jwtSecret   string
}

func NewMobileAuthHandler(db *database.Firebase, jwtSecret string) *MobileAuthHandler {
	msg91Service := services.NewMSG91Service(&config.Config{
		MSG91SenderID:   "TPNDLS",
		MSG91TemplateID: "1007865434019534765",
	})
	
	return &MobileAuthHandler{
		db:          db,
		msg91:       msg91Service,
		jwtSecret:   jwtSecret,
	}
}

// Send OTP to mobile number
func (h *MobileAuthHandler) SendOTP(c *gin.Context) {
	var req models.SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Format mobile number
	formattedMobile := h.msg91.FormatMobileNumber(req.MobileNumber)
	
	// Validate mobile number
	if err := h.msg91.ValidateMobileNumber(formattedMobile); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists for login, or allow new registration
	userExists := false
	if req.Purpose == "login" {
		// Check if user exists
		docs, err := h.db.Client.Collection("mobile_users").Where("mobile_number", "==", formattedMobile).Documents(h.db.Context).GetAll()
		if err == nil && len(docs) > 0 {
			userExists = true
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Mobile number not registered. Please sign up first."})
			return
		}
	}

	// Check for recent OTP (rate limiting)
	recentOTPs, err := h.db.Client.Collection("mobile_otps").
		Where("mobile_number", "==", formattedMobile).
		Where("created_at", ">", time.Now().Add(-2*time.Minute)).
		Documents(h.db.Context).GetAll()
	
	if err == nil && len(recentOTPs) > 0 {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error": "Please wait 2 minutes before requesting another OTP",
		})
		return
	}

	// Generate OTP
	otp := h.msg91.GenerateOTP()

	// Save OTP to database
	otpRecord := &models.MobileOTP{
		ID:           utils.GenerateIDWithPrefix("otp"),
		MobileNumber: formattedMobile,
		OTP:          otp,
		Purpose:      req.Purpose,
		ExpiresAt:    time.Now().Add(5 * time.Minute),
		IsUsed:       false,
		IsVerified:   false,
		Attempts:     0,
		CreatedAt:    time.Now(),
	}

	if _, err := h.db.Client.Collection("mobile_otps").Doc(otpRecord.ID).Set(h.db.Context, otpRecord); err != nil {
		log.Printf("Failed to save OTP record: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process OTP request"})
		return
	}

	// Send OTP via MSG91
	if err := h.msg91.SendOTP(formattedMobile, otp); err != nil {
		log.Printf("Failed to send OTP via MSG91: %v", err)
		// Try backup method
		if err := h.msg91.SendOTPDirect(formattedMobile, otp); err != nil {
			log.Printf("Failed to send OTP via backup method: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "OTP sent successfully",
		"mobile_number": formattedMobile,
		"expires_in": "5 minutes",
		"user_exists": userExists,
	})
}

// Verify OTP and authenticate user
func (h *MobileAuthHandler) VerifyOTP(c *gin.Context) {
	var req models.VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Format mobile number
	formattedMobile := h.msg91.FormatMobileNumber(req.MobileNumber)

	// Find valid OTP
	docs, err := h.db.Client.Collection("mobile_otps").
		Where("mobile_number", "==", formattedMobile).
		Where("otp", "==", req.OTP).
		Where("purpose", "==", req.Purpose).
		Where("is_used", "==", false).
		Where("expires_at", ">", time.Now()).
		Documents(h.db.Context).GetAll()

	if err != nil || len(docs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	otpDoc := docs[0]
	var otpRecord models.MobileOTP
	otpDoc.DataTo(&otpRecord)

	// Update OTP as used
	otpDoc.Ref.Update(h.db.Context, []firestore.Update{
		{Path: "is_used", Value: true},
		{Path: "is_verified", Value: true},
		{Path: "used_at", Value: time.Now()},
	})

	// Find or create user
	var user models.MobileUser
	var isNewUser bool

	userDocs, err := h.db.Client.Collection("mobile_users").
		Where("mobile_number", "==", formattedMobile).
		Documents(h.db.Context).GetAll()

	if err != nil || len(userDocs) == 0 {
		// Create new user
		isNewUser = true
		user = models.MobileUser{
			ID:           utils.GenerateIDWithPrefix("user"),
			MobileNumber: formattedMobile,
			IsActive:     true,
			IsVerified:   true,
			Role:         "customer",
			Preferences: models.Preferences{
				EmailNotifications: true,
				SMSNotifications:   true,
			},
			LastLoginAt: time.Now(),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		if _, err := h.db.Client.Collection("mobile_users").Doc(user.ID).Set(h.db.Context, user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
	} else {
		// Existing user - update last login
		userDoc := userDocs[0]
		userDoc.DataTo(&user)
		
		userDoc.Ref.Update(h.db.Context, []firestore.Update{
			{Path: "last_login_at", Value: time.Now()},
			{Path: "updated_at", Value: time.Now()},
		})
	}

	// Generate JWT token
	token, err := h.generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.MobileAuthResponse{
		Success:   true,
		Message:   "Authentication successful",
		Token:     token,
		User:      &user,
		ExpiresIn: 24 * 60 * 60, // 24 hours
		IsNewUser: isNewUser,
	})
}

// Complete profile for new mobile users
func (h *MobileAuthHandler) CompleteProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var req models.CompleteProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update user profile
	userDoc := h.db.Client.Collection("mobile_users").Doc(userID.(string))
	updates := []firestore.Update{
		{Path: "name", Value: req.Name},
		{Path: "updated_at", Value: time.Now()},
	}

	if req.Email != "" {
		updates = append(updates, firestore.Update{Path: "email", Value: req.Email})
	}

	if req.FirstName != "" {
		updates = append(updates, firestore.Update{Path: "profile.first_name", Value: req.FirstName})
	}

	if req.LastName != "" {
		updates = append(updates, firestore.Update{Path: "profile.last_name", Value: req.LastName})
	}

	if _, err := userDoc.Update(h.db.Context, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Profile updated successfully",
	})
}

// Generate JWT token for mobile user
func (h *MobileAuthHandler) generateJWT(user models.MobileUser) (string, error) {
	claims := jwt.MapClaims{
		"user_id":       user.ID,
		"mobile_number": user.MobileNumber,
		"name":          user.Name,
		"role":          user.Role,
		"exp":           time.Now().Add(24 * time.Hour).Unix(),
		"iss":           "tripund-mobile-auth",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.jwtSecret))
}

// Get mobile user profile
func (h *MobileAuthHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	userDoc, err := h.db.Client.Collection("mobile_users").Doc(userID.(string)).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var user models.MobileUser
	userDoc.DataTo(&user)

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}