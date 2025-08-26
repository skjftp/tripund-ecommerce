package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
)

type ProductHandler struct {
	db *database.Firebase
}

func NewProductHandler(db *database.Firebase) *ProductHandler {
	return &ProductHandler{db: db}
}

func (h *ProductHandler) GetProducts(c *gin.Context) {
	products := make([]models.Product, 0)
	
	// Build Firestore query based on filters
	query := h.db.Client.Collection("products").Query
	
	// Get filter parameters
	category := c.Query("category")
	subcategory := c.Query("subcategory")
	if subcategory == "" {
		subcategory = c.Query("type")
	}
	
	// Firestore only allows one array-contains per query
	// So we'll filter by category in Firestore and subcategory in memory
	if category != "" {
		query = query.Where("categories", "array-contains", category)
	}
	
	// Status filter
	status := c.Query("status")
	if status != "" && status != "all" {
		query = query.Where("status", "==", status)
	} else if status == "" {
		// Default to active if no status specified
		query = query.Where("status", "==", "active")
	}
	
	// Featured filter
	if featured := c.Query("featured"); featured == "true" {
		query = query.Where("featured", "==", true)
	}
	
	// Get limit for final result
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}
	
	// If we need to filter by subcategory in memory, fetch more results
	queryLimit := limit
	if subcategory != "" {
		queryLimit = 500 // Fetch more to ensure we have enough after filtering
	}
	query = query.Limit(queryLimit)
	
	// Execute query
	docs, err := query.Documents(h.db.Context).GetAll()
	if err != nil {
		fmt.Printf("Firestore query error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	// Parse and filter products
	for _, doc := range docs {
		var product models.Product
		if err := doc.DataTo(&product); err != nil {
			fmt.Printf("Error parsing product %s: %v\n", doc.Ref.ID, err)
			continue
		}
		product.ID = doc.Ref.ID
		
		// Apply subcategory filter in memory if needed
		if subcategory != "" {
			found := false
			for _, subcat := range product.Subcategories {
				// Simple case-insensitive comparison
				if strings.EqualFold(strings.TrimSpace(subcat), strings.TrimSpace(subcategory)) {
					found = true
					break
				}
				// Also try with spaces replacing dashes/underscores
				normalizedQuery := strings.ReplaceAll(subcategory, "-", " ")
				normalizedQuery = strings.ReplaceAll(normalizedQuery, "_", " ")
				normalizedQuery = strings.ReplaceAll(normalizedQuery, "+", " ")
				if strings.EqualFold(strings.TrimSpace(subcat), strings.TrimSpace(normalizedQuery)) {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}
		
		products = append(products, product)
		
		// Stop if we have enough products
		if len(products) >= limit {
			break
		}
	}

	// Ensure we don't exceed the requested limit
	if len(products) > limit {
		products = products[:limit]
	}

	fmt.Printf("Returning %d products after filtering\n", len(products))

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"count":    len(products),
	})
}

func (h *ProductHandler) GetProduct(c *gin.Context) {
	productID := c.Param("id")
	
	doc, err := h.db.Client.Collection("products").Doc(productID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var product models.Product
	if err := doc.DataTo(&product); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse product data"})
		return
	}
	product.ID = doc.Ref.ID

	c.JSON(http.StatusOK, product)
}

func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()
	product.Status = "active"

	docRef, _, err := h.db.Client.Collection("products").Add(h.db.Context, product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	product.ID = docRef.ID
	c.JSON(http.StatusCreated, product)
}

func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	productID := c.Param("id")
	
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates["updated_at"] = time.Now()

	var firestoreUpdates []firestore.Update
	for key, value := range updates {
		firestoreUpdates = append(firestoreUpdates, firestore.Update{
			Path:  key,
			Value: value,
		})
	}

	_, err := h.db.Client.Collection("products").Doc(productID).Update(h.db.Context, firestoreUpdates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product updated successfully"})
}

func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	productID := c.Param("id")
	
	_, err := h.db.Client.Collection("products").Doc(productID).Delete(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

func (h *ProductHandler) SearchProducts(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query required"})
		return
	}

	var products []models.Product
	
	docs, err := h.db.Client.Collection("products").
		Where("status", "==", "active").
		Documents(h.db.Context).GetAll()
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search products"})
		return
	}

	for _, doc := range docs {
		var product models.Product
		if err := doc.DataTo(&product); err != nil {
			// Skip products that fail to parse
			continue
		}
		product.ID = doc.Ref.ID
		products = append(products, product)
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"count":    len(products),
		"query":    searchQuery,
	})
}

