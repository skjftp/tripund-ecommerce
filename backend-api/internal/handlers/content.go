package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
)

type ContentHandler struct {
	db *database.Firebase
}

func NewContentHandler(db *database.Firebase) *ContentHandler {
	return &ContentHandler{db: db}
}

// GetContent gets content by type (public endpoint)
func (h *ContentHandler) GetContent(c *gin.Context) {
	contentType := c.Param("type")
	
	content, err := h.db.GetContentByType(contentType)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Content not found"})
		return
	}

	c.JSON(http.StatusOK, content)
}

// UpdateContent updates content (admin only)
func (h *ContentHandler) UpdateContent(c *gin.Context) {
	contentType := c.Param("type")
	
	var content models.Content
	if err := c.ShouldBindJSON(&content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, _ := c.Get("userID")
	
	content.Type = contentType
	content.LastUpdated = time.Now()
	content.UpdatedBy = userID.(string)
	content.Published = true

	if err := h.db.UpdateContent(contentType, &content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update content"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Content updated successfully", "content": content})
}

// GetFAQs gets all FAQs (public endpoint)
func (h *ContentHandler) GetFAQs(c *gin.Context) {
	faqs, err := h.db.GetFAQs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch FAQs"})
		return
	}

	c.JSON(http.StatusOK, faqs)
}

// CreateFAQ creates a new FAQ (admin only)
func (h *ContentHandler) CreateFAQ(c *gin.Context) {
	var faq models.FAQ
	if err := c.ShouldBindJSON(&faq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	faq.Created = time.Now()
	faq.Updated = time.Now()
	faq.Active = true

	id, err := h.db.CreateFAQ(&faq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create FAQ"})
		return
	}

	faq.ID = id
	c.JSON(http.StatusCreated, faq)
}

// UpdateFAQ updates an existing FAQ (admin only)
func (h *ContentHandler) UpdateFAQ(c *gin.Context) {
	id := c.Param("id")
	
	var faq models.FAQ
	if err := c.ShouldBindJSON(&faq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	faq.ID = id
	faq.Updated = time.Now()

	if err := h.db.UpdateFAQ(id, &faq); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update FAQ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "FAQ updated successfully", "faq": faq})
}

// DeleteFAQ deletes an FAQ (admin only)
func (h *ContentHandler) DeleteFAQ(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.DeleteFAQ(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete FAQ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "FAQ deleted successfully"})
}

// GetAllContent gets all content types for admin panel
func (h *ContentHandler) GetAllContent(c *gin.Context) {
	contents, err := h.db.GetAllContent()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch content"})
		return
	}

	c.JSON(http.StatusOK, contents)
}