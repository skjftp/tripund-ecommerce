package handlers

import (
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
)

type CategoryHandler struct {
	db     *database.Firebase
	memory *database.MemoryStore
}

func NewCategoryHandler(db *database.Firebase) *CategoryHandler {
	return &CategoryHandler{
		db:     db,
		memory: database.NewMemoryStore(),
	}
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	var categories []models.Category
	
	// First try to fetch from Firestore
	if h.db != nil && h.db.Client != nil {
		docs, err := h.db.Client.Collection("categories").
			OrderBy("order", firestore.Asc).
			Documents(h.db.Context).GetAll()
		
		if err == nil && len(docs) > 0 {
			for _, doc := range docs {
				var category models.Category
				data := doc.Data()
				
				// Manually map fields to handle type inconsistencies
				category.ID = doc.Ref.ID
				if sku, ok := data["sku"].(string); ok {
					category.SKU = sku
				}
				if name, ok := data["name"].(string); ok {
					category.Name = name
				}
				if slug, ok := data["slug"].(string); ok {
					category.Slug = slug
				}
				if description, ok := data["description"].(string); ok {
					category.Description = description
				}
				if image, ok := data["image"].(string); ok {
					category.Image = image
				}
				if landscapeImage, ok := data["landscape_image"].(string); ok {
					category.LandscapeImage = landscapeImage
				}
				if order, ok := data["order"].(int64); ok {
					category.Order = int(order)
				}
				
				// Handle children subcategories
				if children, ok := data["children"].([]interface{}); ok {
					for _, child := range children {
						if childMap, ok := child.(map[string]interface{}); ok {
							subCat := models.SubCategory{}
							if name, ok := childMap["name"].(string); ok {
								subCat.Name = name
							}
							if count, ok := childMap["product_count"].(int64); ok {
								subCat.ProductCount = int(count)
							}
							category.Children = append(category.Children, subCat)
						}
					}
				}
				
				// Handle timestamps - can be either string or time.Time
				if createdAt, ok := data["created_at"].(time.Time); ok {
					category.CreatedAt = createdAt
				} else if createdAtStr, ok := data["created_at"].(string); ok {
					if t, err := time.Parse(time.RFC3339, createdAtStr); err == nil {
						category.CreatedAt = t
					}
				}
				
				if updatedAt, ok := data["updated_at"].(time.Time); ok {
					category.UpdatedAt = updatedAt
				} else if updatedAtStr, ok := data["updated_at"].(string); ok {
					if t, err := time.Parse(time.RFC3339, updatedAtStr); err == nil {
						category.UpdatedAt = t
					}
				}
				
				categories = append(categories, category)
			}
			
			c.JSON(http.StatusOK, gin.H{
				"categories": categories,
				"count":      len(categories),
				"source":     "firestore",
			})
			return
		}
	}

	// Fall back to memory store if Firestore is not available or empty
	if h.memory != nil {
		categories, err := h.memory.GetCategories(c.Request.Context())
		if err == nil && len(categories) > 0 {
			c.JSON(http.StatusOK, gin.H{
				"categories": categories,
				"count":      len(categories),
				"source":     "memory",
			})
			return
		}
	}

	// Return empty array if no categories found
	if categories == nil {
		categories = []models.Category{}
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
		"count":      len(categories),
		"source":     "none",
	})
}

func (h *CategoryHandler) GetCategory(c *gin.Context) {
	categoryID := c.Param("id")
	
	doc, err := h.db.Client.Collection("categories").Doc(categoryID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	var category models.Category
	data := doc.Data()
	
	// Manually map fields to handle type inconsistencies
	category.ID = doc.Ref.ID
	if sku, ok := data["sku"].(string); ok {
		category.SKU = sku
	}
	if name, ok := data["name"].(string); ok {
		category.Name = name
	}
	if slug, ok := data["slug"].(string); ok {
		category.Slug = slug
	}
	if description, ok := data["description"].(string); ok {
		category.Description = description
	}
	if image, ok := data["image"].(string); ok {
		category.Image = image
	}
	if landscapeImage, ok := data["landscape_image"].(string); ok {
		category.LandscapeImage = landscapeImage
	}
	if order, ok := data["order"].(int64); ok {
		category.Order = int(order)
	}
	
	// Handle children subcategories
	if children, ok := data["children"].([]interface{}); ok {
		for _, child := range children {
			if childMap, ok := child.(map[string]interface{}); ok {
				subCat := models.SubCategory{}
				if name, ok := childMap["name"].(string); ok {
					subCat.Name = name
				}
				if count, ok := childMap["product_count"].(int64); ok {
					subCat.ProductCount = int(count)
				}
				category.Children = append(category.Children, subCat)
			}
		}
	}
	
	// Handle timestamps - can be either string or time.Time
	if createdAt, ok := data["created_at"].(time.Time); ok {
		category.CreatedAt = createdAt
	} else if createdAtStr, ok := data["created_at"].(string); ok {
		if t, err := time.Parse(time.RFC3339, createdAtStr); err == nil {
			category.CreatedAt = t
		}
	}
	
	if updatedAt, ok := data["updated_at"].(time.Time); ok {
		category.UpdatedAt = updatedAt
	} else if updatedAtStr, ok := data["updated_at"].(string); ok {
		if t, err := time.Parse(time.RFC3339, updatedAtStr); err == nil {
			category.UpdatedAt = t
		}
	}

	c.JSON(http.StatusOK, category)
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()

	docRef, _, err := h.db.Client.Collection("categories").Add(h.db.Context, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	category.ID = docRef.ID
	c.JSON(http.StatusCreated, category)
}

func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	categoryID := c.Param("id")
	
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

	_, err := h.db.Client.Collection("categories").Doc(categoryID).Update(h.db.Context, firestoreUpdates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category updated successfully"})
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	categoryID := c.Param("id")
	
	_, err := h.db.Client.Collection("categories").Doc(categoryID).Delete(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}

func (h *CategoryHandler) InitializeDefaultCategories(c *gin.Context) {
	// Default TRIPUND categories structure
	defaultCategories := []models.Category{
		{
			SKU:         "TLSFL00001",
			Name:        "Festivals",
			Slug:        "festivals",
			Description: "Festive decorations and items",
			Order:       1,
			Children: []models.SubCategory{
				{Name: "Torans", ProductCount: 0},
				{Name: "Door Décor/Hanging", ProductCount: 0},
				{Name: "Garlands", ProductCount: 0},
				{Name: "Decorations", ProductCount: 0},
				{Name: "Rangoli", ProductCount: 0},
			},
		},
		{
			SKU:         "TLSWD00001",
			Name:        "Wall Décor",
			Slug:        "wall-decor",
			Description: "Wall decorations and hangings",
			Order:       2,
			Children: []models.SubCategory{
				{Name: "Wall Hangings", ProductCount: 0},
				{Name: "Paintings", ProductCount: 0},
				{Name: "Frames", ProductCount: 0},
				{Name: "Mirrors", ProductCount: 0},
				{Name: "Clocks", ProductCount: 0},
			},
		},
		{
			SKU:         "TLSLT00001",
			Name:        "Lighting",
			Slug:        "lighting",
			Description: "Decorative lighting solutions",
			Order:       3,
			Children: []models.SubCategory{
				{Name: "Candles", ProductCount: 0},
				{Name: "Diyas", ProductCount: 0},
				{Name: "Lanterns", ProductCount: 0},
				{Name: "Decorative Lights", ProductCount: 0},
			},
		},
		{
			SKU:         "TLSHA00001",
			Name:        "Home Accent",
			Slug:        "home-accent",
			Description: "Home decoration accents",
			Order:       4,
			Children: []models.SubCategory{
				{Name: "Cushion Covers", ProductCount: 0},
				{Name: "Table Décor", ProductCount: 0},
				{Name: "Vases", ProductCount: 0},
				{Name: "Showpieces", ProductCount: 0},
			},
		},
		{
			SKU:         "TLSDC00001",
			Name:        "Divine Collections",
			Slug:        "divine-collections",
			Description: "Religious and spiritual items",
			Order:       5,
			Children: []models.SubCategory{
				{Name: "Idols", ProductCount: 0},
				{Name: "Pooja Items", ProductCount: 0},
				{Name: "Spiritual Décor", ProductCount: 0},
			},
		},
		{
			SKU:         "TLSSB00001",
			Name:        "Storage & Bags",
			Slug:        "storage-bags",
			Description: "Storage solutions and bags",
			Order:       6,
			Children: []models.SubCategory{
				{Name: "Storage Boxes", ProductCount: 0},
				{Name: "Bags", ProductCount: 0},
				{Name: "Organizers", ProductCount: 0},
			},
		},
		{
			SKU:         "TLSGF00001",
			Name:        "Gifting",
			Slug:        "gifting",
			Description: "Gift items and hampers",
			Order:       7,
			Children: []models.SubCategory{
				{Name: "Gift Sets", ProductCount: 0},
				{Name: "Hampers", ProductCount: 0},
				{Name: "Personalized Gifts", ProductCount: 0},
			},
		},
	}

	batch := h.db.Client.Batch()
	
	for _, category := range defaultCategories {
		category.CreatedAt = time.Now()
		category.UpdatedAt = time.Now()
		docRef := h.db.Client.Collection("categories").NewDoc()
		batch.Set(docRef, category)
	}

	_, err := batch.Commit(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize categories"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Categories initialized successfully",
		"count":   len(defaultCategories),
	})
}