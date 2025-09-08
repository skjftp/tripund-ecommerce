package handlers

import (
	"fmt"
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
	db               *database.Firebase
	msg91            *services.MSG91Service
	whatsappService  *services.WhatsAppService
	jwtSecret        string
}

func NewMobileAuthHandler(db *database.Firebase, jwtSecret string, cfg *config.Config, whatsappService *services.WhatsAppService) *MobileAuthHandler {
	msg91Service := services.NewMSG91Service(cfg)
	
	return &MobileAuthHandler{
		db:               db,
		msg91:            msg91Service,
		whatsappService:  whatsappService,
		jwtSecret:        jwtSecret,
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

	// Universal login: Check if user exists (no separate login/register flow)
	userDocs, err := h.db.Client.Collection("mobile_users").Where("mobile_number", "==", formattedMobile).Documents(h.db.Context).GetAll()
	userExists := err == nil && len(userDocs) > 0
	
	log.Printf("Universal login: mobile=%s, userExists=%v", formattedMobile, userExists)

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
		Purpose:      "universal", // Universal login (no separate login/register)
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

	// Send OTP based on delivery method choice
	var deliveryError error
	
	if req.DeliveryMethod == "whatsapp" {
		// Send via WhatsApp first
		if h.whatsappService != nil {
			deliveryError = h.sendWhatsAppOTP(formattedMobile, otp)
		} else {
			deliveryError = fmt.Errorf("WhatsApp service not available")
		}
	} else {
		// Send via SMS (MSG91)
		deliveryError = h.msg91.SendOTP(formattedMobile, otp)
	}
	
	// If primary method fails, try the other method as backup
	if deliveryError != nil {
		log.Printf("Primary delivery method (%s) failed: %v", req.DeliveryMethod, deliveryError)
		
		if req.DeliveryMethod == "whatsapp" {
			// Fallback to SMS
			log.Printf("Falling back to SMS delivery")
			if err := h.msg91.SendOTP(formattedMobile, otp); err != nil {
				log.Printf("SMS fallback also failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP via both WhatsApp and SMS"})
				return
			}
		} else {
			// Fallback to WhatsApp
			log.Printf("Falling back to WhatsApp delivery")
			if h.whatsappService != nil {
				if err := h.sendWhatsAppOTP(formattedMobile, otp); err != nil {
					log.Printf("WhatsApp fallback also failed: %v", err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP via both SMS and WhatsApp"})
					return
				}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
				return
			}
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

	// Find valid OTP with simplified query to avoid composite index requirement
	log.Printf("Verifying OTP: mobile=%s, otp=%s", formattedMobile, req.OTP)
	
	// Get all OTPs for this mobile number (simple query)
	docs, err := h.db.Client.Collection("mobile_otps").
		Where("mobile_number", "==", formattedMobile).
		Documents(h.db.Context).GetAll()

	if err != nil {
		log.Printf("Database error during OTP verification: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	
	log.Printf("Found %d OTP records for mobile %s", len(docs), formattedMobile)
	
	// Find matching OTP manually (to avoid composite index)
	var validOtpDoc *firestore.DocumentSnapshot
	for _, doc := range docs {
		var otpRecord models.MobileOTP
		if err := doc.DataTo(&otpRecord); err == nil {
			log.Printf("Checking OTP: otp=%s, purpose=%s, used=%v, expires=%v", 
				otpRecord.OTP, otpRecord.Purpose, otpRecord.IsUsed, otpRecord.ExpiresAt.After(time.Now()))
			
			// Check all conditions manually (no purpose check for universal login)
			if otpRecord.OTP == req.OTP && 
			   !otpRecord.IsUsed && 
			   otpRecord.ExpiresAt.After(time.Now()) {
				validOtpDoc = doc
				log.Printf("Found valid matching OTP!")
				break
			}
		}
	}
	
	if validOtpDoc == nil {
		log.Printf("No valid OTP found for mobile=%s, otp=%s", formattedMobile, req.OTP)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	var otpRecord models.MobileOTP
	validOtpDoc.DataTo(&otpRecord)

	// Update OTP as used
	validOtpDoc.Ref.Update(h.db.Context, []firestore.Update{
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

// Send OTP via WhatsApp using the new 'otp' template
func (h *MobileAuthHandler) sendWhatsAppOTP(mobileNumber, otp string) error {
	if h.whatsappService == nil {
		return fmt.Errorf("WhatsApp service not available")
	}
	
	// Use the enhanced SendTemplateMessage that handles button parameters for 'otp' template
	_, err := h.whatsappService.SendTemplateMessage(
		mobileNumber,
		"otp", // Your new OTP template name  
		"en_US",
		[]models.ParameterContent{
			{Type: "text", Text: otp}, // {{1}} parameter for body
			{Type: "text", Text: otp}, // {{1}} parameter for button URL
		},
	)
	return err
}