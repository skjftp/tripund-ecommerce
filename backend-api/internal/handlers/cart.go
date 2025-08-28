package handlers

import (
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
)

type CartHandler struct {
	db *database.Database
}

func NewCartHandler(db *database.Database) *CartHandler {
	return &CartHandler{db: db}
}

// GetCart returns the user's cart
func (h *CartHandler) GetCart(c *gin.Context) {
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

	c.JSON(http.StatusOK, gin.H{
		"cart": user.Cart,
	})
}

// UpdateCart updates the entire cart
func (h *CartHandler) UpdateCart(c *gin.Context) {
	userID := c.GetString("user_id")
	log.Printf("UpdateCart called for user: %s", userID)
	
	var cart []models.CartItem
	if err := c.ShouldBindJSON(&cart); err != nil {
		log.Printf("Error binding cart JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Updating cart with %d items", len(cart))

	_, err := h.db.Client.Collection("users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "cart", Value: cart},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		log.Printf("Error updating cart in Firestore: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart"})
		return
	}

	log.Printf("Successfully updated cart for user %s", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Cart updated successfully", "cart": cart})
}

// ClearCart clears the user's cart
func (h *CartHandler) ClearCart(c *gin.Context) {
	userID := c.GetString("user_id")
	
	_, err := h.db.Client.Collection("users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "cart", Value: []models.CartItem{}},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart cleared successfully"})
}