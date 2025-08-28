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

type WishlistHandler struct {
	db *database.Database
}

func NewWishlistHandler(db *database.Database) *WishlistHandler {
	return &WishlistHandler{db: db}
}

// GetWishlist returns the user's wishlist
func (h *WishlistHandler) GetWishlist(c *gin.Context) {
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
		"wishlist": user.Wishlist,
	})
}

// UpdateWishlist updates the entire wishlist
func (h *WishlistHandler) UpdateWishlist(c *gin.Context) {
	userID := c.GetString("user_id")
	log.Printf("UpdateWishlist called for user: %s", userID)
	
	var wishlist []string
	if err := c.ShouldBindJSON(&wishlist); err != nil {
		log.Printf("Error binding wishlist JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Updating wishlist with %d items", len(wishlist))

	_, err := h.db.Client.Collection("users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "wishlist", Value: wishlist},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		log.Printf("Error updating wishlist in Firestore: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update wishlist"})
		return
	}

	log.Printf("Successfully updated wishlist for user %s", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Wishlist updated successfully", "wishlist": wishlist})
}

// AddToWishlist adds a product to the wishlist
func (h *WishlistHandler) AddToWishlist(c *gin.Context) {
	userID := c.GetString("user_id")
	productID := c.Param("productId")
	
	// Get current user data
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

	// Check if product already in wishlist
	for _, id := range user.Wishlist {
		if id == productID {
			c.JSON(http.StatusOK, gin.H{"message": "Product already in wishlist"})
			return
		}
	}

	// Add product to wishlist
	user.Wishlist = append(user.Wishlist, productID)

	_, err = h.db.Client.Collection("users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "wishlist", Value: user.Wishlist},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Added to wishlist", "wishlist": user.Wishlist})
}

// RemoveFromWishlist removes a product from the wishlist
func (h *WishlistHandler) RemoveFromWishlist(c *gin.Context) {
	userID := c.GetString("user_id")
	productID := c.Param("productId")
	
	// Get current user data
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

	// Remove product from wishlist
	newWishlist := []string{}
	for _, id := range user.Wishlist {
		if id != productID {
			newWishlist = append(newWishlist, id)
		}
	}

	_, err = h.db.Client.Collection("users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "wishlist", Value: newWishlist},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from wishlist", "wishlist": newWishlist})
}