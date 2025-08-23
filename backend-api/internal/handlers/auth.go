package handlers

import (
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"tripund-api/internal/database"
	"tripund-api/internal/middleware"
	"tripund-api/internal/models"
)

type AuthHandler struct {
	db                  *database.Firebase
	secret              string
	notificationHandler *NotificationHandler
}

func NewAuthHandler(db *database.Firebase, secret string) *AuthHandler {
	return &AuthHandler{
		db:                  db,
		secret:              secret,
		notificationHandler: NewNotificationHandler(db),
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Profile: models.UserProfile{
			FirstName: req.FirstName,
			LastName:  req.LastName,
			Phone:     req.Phone,
		},
		Role:      "customer",
		CreatedAt: time.Now(),
	}

	docRef, _, err := h.db.Client.Collection("users").Add(h.db.Context, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	user.ID = docRef.ID
	
	// Create notification for new user registration
	userName := req.FirstName + " " + req.LastName
	h.notificationHandler.NotifyNewUser(userName, req.Email)
	
	token, expiresIn, err := h.generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token:     token,
		ExpiresIn: expiresIn,
		User:      user,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := h.db.Client.Collection("users").Where("email", "==", req.Email).Limit(1)
	docs, err := query.Documents(h.db.Context).GetAll()
	if err != nil || len(docs) == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	var user models.User
	if err := docs[0].DataTo(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}
	user.ID = docs[0].Ref.ID

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	docs[0].Ref.Update(h.db.Context, []firestore.Update{
		{Path: "last_login_at", Value: time.Now()},
	})

	token, expiresIn, err := h.generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token:     token,
		ExpiresIn: expiresIn,
		User:      user,
	})
}

func (h *AuthHandler) generateToken(user models.User) (string, int64, error) {
	expiresIn := time.Now().Add(7 * 24 * time.Hour) // 7 days
	claims := middleware.Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresIn),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.secret))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expiresIn.Unix(), nil
}

// RefreshToken generates a new token for authenticated users
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Get the current token from header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
		return
	}

	tokenString := authHeader
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString = strings.TrimPrefix(authHeader, "Bearer ")
	}

	// Parse and validate the token (even if expired, we just want the claims)
	token, _ := jwt.ParseWithClaims(tokenString, &middleware.Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.secret), nil
	})

	if token == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	claims, ok := token.Claims.(*middleware.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	// Fetch the user from database to ensure they still exist
	doc, err := h.db.Client.Collection("users").Doc(claims.UserID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var user models.User
	if err := doc.DataTo(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}

	// Generate new token
	newToken, expiresAt, err := h.generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      newToken,
		"expires_at": expiresAt,
		"user":       user,
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	doc, err := h.db.Client.Collection("users").Doc(userID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var user models.User
	if err := doc.DataTo(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}
	user.ID = doc.Ref.ID

	c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	
	var profile models.UserProfile
	if err := c.ShouldBindJSON(&profile); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.db.Client.Collection("users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "profile", Value: profile},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func (h *AuthHandler) AdminLogin(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// For demo purposes, check hardcoded admin credentials
	// In production, this should check against database
	if req.Email == "admin@tripund.com" && req.Password == "admin123" {
		// Create admin user object
		adminUser := models.User{
			ID:    "admin-001",
			Email: "admin@tripund.com",
			Profile: models.UserProfile{
				FirstName: "Admin",
				LastName:  "User",
			},
			Role: "admin",
		}

		token, expiresIn, err := h.generateToken(adminUser)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(http.StatusOK, models.AuthResponse{
			Token:     token,
			ExpiresIn: expiresIn,
			User:      adminUser,
		})
		return
	}

	// Check database for admin users
	query := h.db.Client.Collection("users").Where("email", "==", req.Email).Where("role", "==", "admin").Limit(1)
	docs, err := query.Documents(h.db.Context).GetAll()
	if err != nil || len(docs) == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid admin credentials"})
		return
	}

	var user models.User
	if err := docs[0].DataTo(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}
	user.ID = docs[0].Ref.ID

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid admin credentials"})
		return
	}

	docs[0].Ref.Update(h.db.Context, []firestore.Update{
		{Path: "last_login_at", Value: time.Now()},
	})

	token, expiresIn, err := h.generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token:     token,
		ExpiresIn: expiresIn,
		User:      user,
	})
}
// GetAllUsers returns all users for admin panel
func (h *AuthHandler) GetAllUsers(c *gin.Context) {
	// Get query parameters for filtering
	search := c.Query("search")
	role := c.Query("role")
	status := c.Query("status")

	// Start with base query
	query := h.db.Client.Collection("users").Query

	// Apply filters if provided
	if role != "" && role != "all" {
		query = query.Where("role", "==", role)
	}

	if status != "" && status != "all" {
		query = query.Where("status", "==", status)
	}

	// Get all documents
	docs, err := query.Documents(h.db.Context).GetAll()
	if err != nil {
		log.Printf("Error fetching users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	users := []map[string]interface{}{}
	for _, doc := range docs {
		var user models.User
		if err := doc.DataTo(&user); err != nil {
			log.Printf("Error parsing user %s: %v", doc.Ref.ID, err)
			continue
		}
		user.ID = doc.Ref.ID

		// Filter by search if provided
		if search != "" {
			searchLower := strings.ToLower(search)
			if !strings.Contains(strings.ToLower(user.Email), searchLower) &&
				!strings.Contains(strings.ToLower(user.Profile.FirstName), searchLower) &&
				!strings.Contains(strings.ToLower(user.Profile.LastName), searchLower) {
				continue
			}
		}

		// Get order count for this user
		orderDocs, _ := h.db.Client.Collection("orders").Where("user_id", "==", user.ID).Documents(h.db.Context).GetAll()
		orderCount := len(orderDocs)

		// Calculate total spent
		totalSpent := 0.0
		for _, orderDoc := range orderDocs {
			var order models.Order
			if err := orderDoc.DataTo(&order); err == nil {
				totalSpent += order.Totals.Total
			}
		}

		// Convert user to response format
		userResp := map[string]interface{}{
			"id":           user.ID,
			"email":        user.Email,
			"name":         user.Profile.FirstName + " " + user.Profile.LastName,
			"phone":        user.Profile.Phone,
			"role":         user.Role,
			"status":       "active", // Default status
			"orders_count": orderCount,
			"total_spent":  totalSpent,
			"created_at":   user.CreatedAt,
			"last_login":   user.LastLoginAt,
		}

		users = append(users, userResp)
	}

	// Sort users by created_at descending
	sort.Slice(users, func(i, j int) bool {
		timeI := users[i]["created_at"].(time.Time)
		timeJ := users[j]["created_at"].(time.Time)
		return timeI.After(timeJ)
	})

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": len(users),
	})
}

// GetUserDetails returns detailed information about a specific user
func (h *AuthHandler) GetUserDetails(c *gin.Context) {
	userID := c.Param("id")

	// Get user document
	doc, err := h.db.Client.Collection("users").Doc(userID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var user models.User
	if err := doc.DataTo(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}
	user.ID = doc.Ref.ID

	// Get user's orders
	orderDocs, _ := h.db.Client.Collection("orders").Where("user_id", "==", userID).Documents(h.db.Context).GetAll()
	
	orders := []map[string]interface{}{}
	totalSpent := 0.0
	for _, orderDoc := range orderDocs {
		var order models.Order
		if err := orderDoc.DataTo(&order); err == nil {
			order.ID = orderDoc.Ref.ID
			totalSpent += order.Totals.Total
			
			orders = append(orders, map[string]interface{}{
				"id":           order.ID,
				"order_number": order.OrderNumber,
				"status":       order.Status,
				"total":        order.Totals.Total,
				"created_at":   order.CreatedAt,
			})
		}
	}

	// Sort orders by created_at descending
	sort.Slice(orders, func(i, j int) bool {
		timeI := orders[i]["created_at"].(time.Time)
		timeJ := orders[j]["created_at"].(time.Time)
		return timeI.After(timeJ)
	})

	// Prepare response
	response := gin.H{
		"user": gin.H{
			"id":           user.ID,
			"email":        user.Email,
			"profile":      user.Profile,
			"role":         user.Role,
			"created_at":   user.CreatedAt,
			"last_login":   user.LastLoginAt,
			"orders_count": len(orders),
			"total_spent":  totalSpent,
		},
		"orders": orders,
	}

	c.JSON(http.StatusOK, response)
}
