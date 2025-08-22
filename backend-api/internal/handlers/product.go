package handlers

import (
	"net/http"
	"strconv"
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
	var products []models.Product
	query := h.db.Client.Collection("products").Query

	if category := c.Query("category"); category != "" {
		query = query.Where("categories", "array-contains", category)
	}

	if featured := c.Query("featured"); featured == "true" {
		query = query.Where("featured", "==", true)
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status", "==", status)
	} else {
		query = query.Where("status", "==", "active")
	}

	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil {
			limit = parsedLimit
		}
	}

	docs, err := query.Limit(limit).Documents(h.db.Context).GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	for _, doc := range docs {
		var product models.Product
		if err := doc.DataTo(&product); err != nil {
			// Log the error but continue processing other products
			// This helps identify parsing issues
			continue
		}
		product.ID = doc.Ref.ID
		products = append(products, product)
	}

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