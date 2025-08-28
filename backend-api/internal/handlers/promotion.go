package handlers

import (
	"fmt"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
)

type PromotionHandler struct {
	db *database.Firebase
}

func NewPromotionHandler(db *database.Firebase) *PromotionHandler {
	return &PromotionHandler{db: db}
}

type ValidatePromotionRequest struct {
	Code       string  `json:"code" binding:"required"`
	OrderTotal float64 `json:"order_total" binding:"required"`
	UserID     string  `json:"user_id"`
}

type ValidatePromotionResponse struct {
	Valid    bool                     `json:"valid"`
	Discount float64                  `json:"discount"`
	Type     models.PromotionType     `json:"type"`
	Message  string                   `json:"message"`
	Promo    *models.Promotion        `json:"promotion,omitempty"`
}

func (h *PromotionHandler) ValidatePromotion(c *gin.Context) {
	var req ValidatePromotionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find promotion by code
	iter := h.db.Client.Collection("promotions").Where("code", "==", req.Code).Documents(h.db.Context)
	docs, err := iter.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch promotion"})
		return
	}

	if len(docs) == 0 {
		c.JSON(http.StatusOK, ValidatePromotionResponse{
			Valid:   false,
			Message: "Invalid promo code",
		})
		return
	}

	doc := docs[0]
	var promotion models.Promotion
	if err := doc.DataTo(&promotion); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse promotion"})
		return
	}
	promotion.ID = doc.Ref.ID

	// Validate promotion
	validationResult := h.validatePromotionRules(&promotion, req.OrderTotal, req.UserID)
	if !validationResult.Valid {
		c.JSON(http.StatusOK, validationResult)
		return
	}

	// Calculate actual discount
	actualDiscount := h.calculateDiscount(&promotion, req.OrderTotal)
	
	c.JSON(http.StatusOK, ValidatePromotionResponse{
		Valid:    true,
		Discount: actualDiscount,
		Type:     promotion.Type,
		Message:  "Promo code is valid",
		Promo:    &promotion,
	})
}

func (h *PromotionHandler) validatePromotionRules(promo *models.Promotion, orderTotal float64, userID string) ValidatePromotionResponse {
	now := time.Now()

	// Check if promotion is active
	if promo.Status != models.PromotionStatusActive {
		return ValidatePromotionResponse{
			Valid:   false,
			Message: "This promo code is not active",
		}
	}

	// Check date validity
	if now.Before(promo.StartDate) {
		return ValidatePromotionResponse{
			Valid:   false,
			Message: "This promo code is not yet active",
		}
	}

	if now.After(promo.EndDate) {
		return ValidatePromotionResponse{
			Valid:   false,
			Message: "This promo code has expired",
		}
	}

	// Check minimum order value
	if orderTotal < promo.MinOrderValue {
		return ValidatePromotionResponse{
			Valid:   false,
			Message: fmt.Sprintf("Minimum order value required: ₹%.0f", promo.MinOrderValue),
		}
	}

	// Check maximum uses
	if promo.MaxUses > 0 && promo.UsedCount >= promo.MaxUses {
		return ValidatePromotionResponse{
			Valid:   false,
			Message: "This promo code has reached its usage limit",
		}
	}

	// Check user-specific limits
	if userID != "" {
		userUsageCount := h.getUserPromotionUsageCount(promo.ID, userID)
		if promo.MaxUsesPerUser > 0 && userUsageCount >= promo.MaxUsesPerUser {
			return ValidatePromotionResponse{
				Valid:   false,
				Message: "You have already used this promo code",
			}
		}

		// Check if it's for new customers only
		if promo.NewCustomersOnly {
			if h.isReturningCustomer(userID) {
				return ValidatePromotionResponse{
					Valid:   false,
					Message: "This promo code is only for new customers",
				}
			}
		}

		// Check allowed user IDs
		if len(promo.AllowedUserIds) > 0 {
			allowed := false
			for _, allowedID := range promo.AllowedUserIds {
				if allowedID == userID {
					allowed = true
					break
				}
			}
			if !allowed {
				return ValidatePromotionResponse{
					Valid:   false,
					Message: "This promo code is not available for your account",
				}
			}
		}
	}

	return ValidatePromotionResponse{Valid: true}
}

func (h *PromotionHandler) calculateDiscount(promo *models.Promotion, orderTotal float64) float64 {
	var discount float64

	if promo.Type == models.PromotionTypePercentage {
		discount = (orderTotal * promo.Discount) / 100
		// Apply max discount limit if set
		if promo.MaxDiscount > 0 && discount > promo.MaxDiscount {
			discount = promo.MaxDiscount
		}
	} else {
		discount = promo.Discount
	}

	// Ensure discount doesn't exceed order total
	if discount > orderTotal {
		discount = orderTotal
	}

	return discount
}

func (h *PromotionHandler) getUserPromotionUsageCount(promoID, userID string) int {
	if userID == "" {
		return 0
	}

	iter := h.db.Client.Collection("promotion_usage").
		Where("promotion_id", "==", promoID).
		Where("user_id", "==", userID).
		Documents(h.db.Context)

	count := 0
	for {
		_, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err == nil {
			count++
		}
	}

	return count
}

func (h *PromotionHandler) isReturningCustomer(userID string) bool {
	if userID == "" {
		return false
	}

	// Check if user has any completed orders
	iter := h.db.Client.Collection("orders").
		Where("user_id", "==", userID).
		Where("status", "==", "completed").
		Limit(1).
		Documents(h.db.Context)

	_, err := iter.Next()
	return err != iterator.Done
}

// GetActivePromotions returns public active promo codes for display in frontend
func (h *PromotionHandler) GetActivePromotions(c *gin.Context) {
	now := time.Now()
	
	// Query for active promotions
	iter := h.db.Client.Collection("promotions").
		Where("status", "==", models.PromotionStatusActive).
		Where("show_in_banner", "==", true).
		OrderBy("created_at", firestore.Desc).
		Documents(h.db.Context)
	
	docs, err := iter.GetAll()
	if err != nil {
		// Return a default promotion if query fails
		c.JSON(http.StatusOK, gin.H{
			"promotions": []map[string]interface{}{
				{
					"code":        "TRIPUND10",
					"description": "10% off on all orders",
					"type":        "percentage",
					"discount":    10,
				},
			},
		})
		return
	}

	var activePromotions []map[string]interface{}
	for _, doc := range docs {
		var promo models.Promotion
		if err := doc.DataTo(&promo); err != nil {
			continue
		}
		
		// Check if promotion is within date range
		if now.Before(promo.StartDate) || now.After(promo.EndDate) {
			continue
		}
		
		// Return only public info
		activePromotions = append(activePromotions, map[string]interface{}{
			"code":        promo.Code,
			"description": promo.Description,
			"type":        promo.Type,
			"discount":    promo.Discount,
		})
	}
	
	// If no active promotions, return a default one
	if len(activePromotions) == 0 {
		activePromotions = []map[string]interface{}{
			{
				"code":        "TRIPUND10",
				"description": "10% off on all orders",
				"type":        "percentage",
				"discount":    10,
			},
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"promotions": activePromotions,
	})
}

// Admin endpoints

func (h *PromotionHandler) GetPromotions(c *gin.Context) {
	iter := h.db.Client.Collection("promotions").OrderBy("created_at", firestore.Desc).Documents(h.db.Context)
	docs, err := iter.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch promotions"})
		return
	}

	var promotions []models.Promotion
	for _, doc := range docs {
		var promo models.Promotion
		if err := doc.DataTo(&promo); err != nil {
			continue
		}
		promo.ID = doc.Ref.ID
		promotions = append(promotions, promo)
	}

	c.JSON(http.StatusOK, gin.H{
		"promotions": promotions,
		"count":      len(promotions),
	})
}

func (h *PromotionHandler) CreatePromotion(c *gin.Context) {
	var promo models.Promotion
	if err := c.ShouldBindJSON(&promo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set timestamps
	now := time.Now()
	promo.CreatedAt = now
	promo.UpdatedAt = now
	promo.UsedCount = 0

	// Get admin user ID from context (set by auth middleware)
	if adminID, exists := c.Get("user_id"); exists {
		promo.CreatedBy = adminID.(string)
	}

	docRef, _, err := h.db.Client.Collection("promotions").Add(h.db.Context, promo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create promotion"})
		return
	}

	promo.ID = docRef.ID
	c.JSON(http.StatusCreated, promo)
}

func (h *PromotionHandler) UpdatePromotion(c *gin.Context) {
	promoID := c.Param("id")
	
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update timestamp
	updates["updated_at"] = time.Now()

	_, err := h.db.Client.Collection("promotions").Doc(promoID).Update(h.db.Context, []firestore.Update{
		{Path: "updated_at", Value: updates["updated_at"]},
	})
	
	// Apply other updates
	for key, value := range updates {
		if key != "updated_at" && key != "id" && key != "created_at" && key != "created_by" {
			h.db.Client.Collection("promotions").Doc(promoID).Update(h.db.Context, []firestore.Update{
				{Path: key, Value: value},
			})
		}
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update promotion"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Promotion updated successfully"})
}

func (h *PromotionHandler) DeletePromotion(c *gin.Context) {
	promoID := c.Param("id")
	
	_, err := h.db.Client.Collection("promotions").Doc(promoID).Delete(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete promotion"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Promotion deleted successfully"})
}

// Initialize default promotions
func (h *PromotionHandler) InitializeDefaultPromotions(c *gin.Context) {
	defaultPromotions := []models.Promotion{
		{
			Code:        "TRIPUND20",
			Description: "20% off on first order",
			Type:        models.PromotionTypePercentage,
			Discount:    20,
			Status:      models.PromotionStatusActive,
			MaxUses:     1000,
			MaxUsesPerUser: 1,
			MinOrderValue: 500,
			MaxDiscount:   1000,
			NewCustomersOnly: true,
			StartDate:   time.Now(),
			EndDate:     time.Now().AddDate(1, 0, 0), // 1 year from now
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			Code:        "WELCOME10",
			Description: "₹100 off on orders above ₹1000",
			Type:        models.PromotionTypeFixed,
			Discount:    100,
			Status:      models.PromotionStatusActive,
			MaxUses:     500,
			MaxUsesPerUser: 1,
			MinOrderValue: 1000,
			NewCustomersOnly: true,
			StartDate:   time.Now(),
			EndDate:     time.Now().AddDate(0, 6, 0), // 6 months from now
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	}

	batch := h.db.Client.Batch()
	
	for _, promo := range defaultPromotions {
		docRef := h.db.Client.Collection("promotions").NewDoc()
		batch.Set(docRef, promo)
	}

	_, err := batch.Commit(h.db.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize promotions"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Default promotions initialized successfully",
		"count":   len(defaultPromotions),
	})
}