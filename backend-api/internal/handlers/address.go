package handlers

import (
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"backend-api/internal/database"
	"backend-api/internal/models"
)

type AddressHandler struct {
	db *database.Database
}

func NewAddressHandler(db *database.Database) *AddressHandler {
	return &AddressHandler{db: db}
}

// GetAddresses returns all addresses for the authenticated user
func (h *AddressHandler) GetAddresses(c *gin.Context) {
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
		"addresses": user.Addresses,
	})
}

// AddAddress adds a new address for the authenticated user
func (h *AddressHandler) AddAddress(c *gin.Context) {
	userID := c.GetString("user_id")
	
	var address models.UserAddress
	if err := c.ShouldBindJSON(&address); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate ID if not provided
	if address.ID == "" {
		address.ID = uuid.New().String()
	}

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

	// If this is the first address or marked as default, make it default
	if len(user.Addresses) == 0 || address.IsDefault {
		// Set all existing addresses to non-default
		for i := range user.Addresses {
			user.Addresses[i].IsDefault = false
		}
		address.IsDefault = true
	}

	// Add the new address
	user.Addresses = append(user.Addresses, address)

	// Update user document
	_, err = h.db.Client.Collection("users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "addresses", Value: user.Addresses},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add address"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Address added successfully",
		"address": address,
	})
}

// UpdateAddress updates an existing address
func (h *AddressHandler) UpdateAddress(c *gin.Context) {
	userID := c.GetString("user_id")
	addressID := c.Param("id")
	
	var address models.UserAddress
	if err := c.ShouldBindJSON(&address); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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

	// Find and update the address
	found := false
	for i, addr := range user.Addresses {
		if addr.ID == addressID {
			// If setting as default, unset other defaults
			if address.IsDefault && !addr.IsDefault {
				for j := range user.Addresses {
					user.Addresses[j].IsDefault = false
				}
			}
			address.ID = addressID // Preserve the ID
			user.Addresses[i] = address
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	// Update user document
	_, err = h.db.Client.Collection("users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "addresses", Value: user.Addresses},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Address updated successfully",
		"address": address,
	})
}

// DeleteAddress deletes an address
func (h *AddressHandler) DeleteAddress(c *gin.Context) {
	userID := c.GetString("user_id")
	addressID := c.Param("id")

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

	// Find and remove the address
	found := false
	wasDefault := false
	newAddresses := []models.UserAddress{}
	for _, addr := range user.Addresses {
		if addr.ID == addressID {
			found = true
			wasDefault = addr.IsDefault
		} else {
			newAddresses = append(newAddresses, addr)
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	// If deleted address was default and there are other addresses, make the first one default
	if wasDefault && len(newAddresses) > 0 {
		newAddresses[0].IsDefault = true
	}

	// Update user document
	_, err = h.db.Client.Collection("users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "addresses", Value: newAddresses},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete address"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Address deleted successfully"})
}

// SetDefaultAddress sets an address as default
func (h *AddressHandler) SetDefaultAddress(c *gin.Context) {
	userID := c.GetString("user_id")
	addressID := c.Param("id")

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

	// Find the address and update default status
	found := false
	for i := range user.Addresses {
		if user.Addresses[i].ID == addressID {
			user.Addresses[i].IsDefault = true
			found = true
		} else {
			user.Addresses[i].IsDefault = false
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	// Update user document
	_, err = h.db.Client.Collection("users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "addresses", Value: user.Addresses},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default address"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Default address updated successfully"})
}