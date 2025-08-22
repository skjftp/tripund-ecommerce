package handlers

import (
	"net/http"
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
	db     *database.Firebase
	secret string
}

func NewAuthHandler(db *database.Firebase, secret string) *AuthHandler {
	return &AuthHandler{db: db, secret: secret}
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
	expiresIn := time.Now().Add(24 * time.Hour)
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