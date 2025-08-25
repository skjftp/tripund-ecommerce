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
	
	// Start with all products query
	allDocs, err := h.db.Client.Collection("products").Documents(h.db.Context).GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	// Parse and convert products
	for _, doc := range allDocs {
		var product models.Product
		if err := doc.DataTo(&product); err != nil {
			fmt.Printf("Error parsing product %s: %v\n", doc.Ref.ID, err)
			continue
		}
		product.ID = doc.Ref.ID
		
		// Apply filters
		if !h.applyFilters(&product, c) {
			continue
		}
		
		products = append(products, product)
	}

	// Apply limit
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil {
			limit = parsedLimit
		}
	}
	
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

// applyFilters checks if a product matches all the filters
func (h *ProductHandler) applyFilters(product *models.Product, c *gin.Context) bool {
	// Category filter
	if category := c.Query("category"); category != "" {
		found := false
		for _, cat := range product.Categories {
			if cat == category {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	// Featured filter
	if featured := c.Query("featured"); featured == "true" {
		if !product.Featured {
			return false
		}
	}

	// Status filter
	status := c.Query("status")
	if status != "" && status != "all" {
		if product.Status != status {
			return false
		}
	} else if status == "" {
		// Default to active if no status specified
		if product.Status != "active" {
			return false
		}
	}

	// Price range filter
	if priceRange := c.Query("price"); priceRange != "" {
		prices := strings.Split(priceRange, "-")
		if len(prices) == 2 {
			minPrice, _ := strconv.ParseFloat(prices[0], 64)
			maxPrice := float64(999999)
			if prices[1] != "" {
				maxPrice, _ = strconv.ParseFloat(prices[1], 64)
			}
			if product.Price < minPrice || product.Price > maxPrice {
				return false
			}
		}
	}

	// Attribute filters (material, type, color, etc.)
	for key, values := range c.Request.URL.Query() {
		// Skip known non-attribute parameters
		if key == "category" || key == "featured" || key == "status" || 
		   key == "price" || key == "limit" || key == "sort" || key == "view" {
			continue
		}
		
		// Check if product has this attribute
		foundAttribute := false
		for _, attr := range product.Attributes {
			if strings.ToLower(attr.Name) == key {
				// Check if the attribute value matches any of the filter values
				filterValues := strings.Split(values[0], ",")
				for _, filterValue := range filterValues {
					if strings.ToLower(attr.Value) == strings.ToLower(filterValue) {
						foundAttribute = true
						break
					}
				}
				break
			}
		}
		
		if !foundAttribute {
			return false
		}
	}

	return true
}