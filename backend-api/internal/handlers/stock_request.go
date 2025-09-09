package handlers

import (
	"log"
	"net/http"
	"sort"
	"strconv"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
	"tripund-api/internal/utils"
)

type StockRequestHandler struct {
	db *database.Firebase
}

func NewStockRequestHandler(db *database.Firebase) *StockRequestHandler {
	return &StockRequestHandler{db: db}
}

// CreateStockRequest allows users to request out-of-stock products
func (h *StockRequestHandler) CreateStockRequest(c *gin.Context) {
	userID := c.GetString("user_id")
	
	var req models.CreateStockRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user details
	userDoc, err := h.db.Client.Collection("mobile_users").Doc(userID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var user models.MobileUser
	if err := userDoc.DataTo(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}

	// Get product details
	productDoc, err := h.db.Client.Collection("products").Doc(req.ProductID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var product models.Product
	if err := productDoc.DataTo(&product); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse product data"})
		return
	}

	// Check if user already has a pending request for this product
	existingRequests, err := h.db.Client.Collection("stock_requests").
		Where("user_id", "==", userID).
		Where("product_id", "==", req.ProductID).
		Where("status", "==", "pending").
		Documents(h.db.Context).GetAll()

	if err == nil && len(existingRequests) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have a pending request for this product"})
		return
	}

	// Create stock request
	stockRequest := &models.StockRequest{
		ID:           utils.GenerateIDWithPrefix("req"),
		ProductID:    req.ProductID,
		ProductSKU:   product.SKU,
		ProductName:  product.Name,
		ProductImage: "",
		UserID:       userID,
		UserName:     user.Name,
		UserEmail:    user.Email,
		UserPhone:    user.MobileNumber,
		VariantColor: req.VariantColor,
		VariantSize:  req.VariantSize,
		Quantity:     req.Quantity,
		MaxPrice:     req.MaxPrice,
		Notes:        req.Notes,
		Status:       "pending",
		Priority:     3, // Default priority
		RequestedAt:  time.Now(),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Set product image if available
	if len(product.Images) > 0 {
		stockRequest.ProductImage = product.Images[0]
	}

	// Save stock request
	if _, err := h.db.Client.Collection("stock_requests").Doc(stockRequest.ID).Set(h.db.Context, stockRequest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save stock request"})
		return
	}

	log.Printf("📦 Stock request created: %s requested %s (SKU: %s) - User: %s (%s)", 
		stockRequest.ID, product.Name, product.SKU, user.Name, user.MobileNumber)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Stock request submitted successfully! We'll notify you when available.",
		"request_id": stockRequest.ID,
	})
}

// GetUserStockRequests returns user's stock requests
func (h *StockRequestHandler) GetUserStockRequests(c *gin.Context) {
	userID := c.GetString("user_id")
	
	docs, err := h.db.Client.Collection("stock_requests").
		Where("user_id", "==", userID).
		OrderBy("created_at", firestore.Desc).
		Documents(h.db.Context).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stock requests"})
		return
	}

	requests := make([]models.StockRequest, 0)
	for _, doc := range docs {
		var request models.StockRequest
		if err := doc.DataTo(&request); err == nil {
			request.ID = doc.Ref.ID
			requests = append(requests, request)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"stock_requests": requests,
		"total": len(requests),
	})
}

// Admin: Get all stock requests with product summary
func (h *StockRequestHandler) GetAdminStockRequests(c *gin.Context) {
	status := c.DefaultQuery("status", "all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	// Build query
	query := h.db.Client.Collection("stock_requests").Query

	if status != "all" {
		query = query.Where("status", "==", status)
	}

	// Get all requests for summary
	docs, err := query.Documents(h.db.Context).GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stock requests"})
		return
	}

	// Process requests and create product summaries
	productSummaries := make(map[string]*models.StockRequestSummary)
	allRequests := make([]models.StockRequest, 0)

	for _, doc := range docs {
		var request models.StockRequest
		if err := doc.DataTo(&request); err == nil {
			request.ID = doc.Ref.ID
			allRequests = append(allRequests, request)

			// Create/update product summary
			if summary, exists := productSummaries[request.ProductID]; exists {
				summary.TotalRequests++
				if request.Status == "pending" {
					summary.PendingCount++
				}
				if request.RequestedAt.After(summary.LatestRequest) {
					summary.LatestRequest = request.RequestedAt
				}
				summary.RequestDetails = append(summary.RequestDetails, models.StockRequestDetail{
					ID:           request.ID,
					UserName:     request.UserName,
					UserPhone:    request.UserPhone,
					UserEmail:    request.UserEmail,
					Quantity:     request.Quantity,
					VariantColor: request.VariantColor,
					VariantSize:  request.VariantSize,
					RequestedAt:  request.RequestedAt,
					Status:       request.Status,
				})
			} else {
				productSummaries[request.ProductID] = &models.StockRequestSummary{
					ProductID:     request.ProductID,
					ProductName:   request.ProductName,
					ProductSKU:    request.ProductSKU,
					ProductImage:  request.ProductImage,
					TotalRequests: 1,
					PendingCount:  func() int { if request.Status == "pending" { return 1 }; return 0 }(),
					LatestRequest: request.RequestedAt,
					RequestDetails: []models.StockRequestDetail{
						{
							ID:           request.ID,
							UserName:     request.UserName,
							UserPhone:    request.UserPhone,
							UserEmail:    request.UserEmail,
							Quantity:     request.Quantity,
							VariantColor: request.VariantColor,
							VariantSize:  request.VariantSize,
							RequestedAt:  request.RequestedAt,
							Status:       request.Status,
						},
					},
				}
			}
		}
	}

	// Convert map to slice and sort by demand
	summarySlice := make([]models.StockRequestSummary, 0, len(productSummaries))
	for _, summary := range productSummaries {
		summarySlice = append(summarySlice, *summary)
	}

	// Sort by total requests (most demanded first)
	sort.Slice(summarySlice, func(i, j int) bool {
		return summarySlice[i].TotalRequests > summarySlice[j].TotalRequests
	})

	// Sort recent requests by date
	sort.Slice(allRequests, func(i, j int) bool {
		return allRequests[i].RequestedAt.After(allRequests[j].RequestedAt)
	})

	// Paginate recent requests
	startIdx := (page - 1) * limit
	endIdx := startIdx + limit
	if endIdx > len(allRequests) {
		endIdx = len(allRequests)
	}
	
	paginatedRequests := allRequests
	if startIdx < len(allRequests) {
		paginatedRequests = allRequests[startIdx:endIdx]
	}

	// Calculate summary stats
	pendingCount := 0
	for _, request := range allRequests {
		if request.Status == "pending" {
			pendingCount++
		}
	}

	response := models.AdminStockRequestResponse{
		TotalRequests:    len(allRequests),
		PendingRequests:  pendingCount,
		ProductSummaries: summarySlice,
		RecentRequests:   paginatedRequests,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateStockRequest allows admin to update request status
func (h *StockRequestHandler) UpdateStockRequest(c *gin.Context) {
	requestID := c.Param("id")
	
	var updateData struct {
		Status     string `json:"status"`
		AdminNotes string `json:"admin_notes"`
		Priority   int    `json:"priority"`
	}
	
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update request
	updates := []firestore.Update{
		{Path: "status", Value: updateData.Status},
		{Path: "admin_notes", Value: updateData.AdminNotes},
		{Path: "priority", Value: updateData.Priority},
		{Path: "updated_at", Value: time.Now()},
	}

	if updateData.Status == "contacted" {
		updates = append(updates, firestore.Update{Path: "contacted_at", Value: time.Now()})
	} else if updateData.Status == "fulfilled" {
		updates = append(updates, firestore.Update{Path: "fulfilled_at", Value: time.Now()})
	}

	if _, err := h.db.Client.Collection("stock_requests").Doc(requestID).Update(h.db.Context, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Stock request updated successfully",
	})
}

// DeleteStockRequest allows admin to delete requests
func (h *StockRequestHandler) DeleteStockRequest(c *gin.Context) {
	requestID := c.Param("id")
	
	if _, err := h.db.Client.Collection("stock_requests").Doc(requestID).Delete(h.db.Context); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete stock request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Stock request deleted successfully",
	})
}