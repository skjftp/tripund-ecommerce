package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
	"tripund-api/internal/utils"
)

type AnalyticsHandler struct {
	db *database.Firebase
}

func NewAnalyticsHandler(db *database.Firebase) *AnalyticsHandler {
	return &AnalyticsHandler{db: db}
}

// Track page visit from frontend
func (h *AnalyticsHandler) TrackPageVisit(c *gin.Context) {
	var request struct {
		Page        string `json:"page" binding:"required"`
		SessionID   string `json:"session_id" binding:"required"`
		UserID      string `json:"user_id,omitempty"`
		Referrer    string `json:"referrer,omitempty"`
		
		// UTM Parameters
		UTMSource   string `json:"utm_source,omitempty"`
		UTMMedium   string `json:"utm_medium,omitempty"`
		UTMCampaign string `json:"utm_campaign,omitempty"`
		UTMContent  string `json:"utm_content,omitempty"`
		UTMTerm     string `json:"utm_term,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Extract device info from User-Agent
	userAgent := c.GetHeader("User-Agent")
	device := getDeviceType(userAgent)
	os := getOSType(userAgent)
	browser := getBrowserType(userAgent)
	
	// Get IP and location info
	ipAddress := getClientIP(c)
	
	visit := &models.PageVisit{
		ID:          utils.GenerateIDWithPrefix("visit"),
		SessionID:   request.SessionID,
		UserID:      request.UserID,
		Page:        request.Page,
		Referrer:    request.Referrer,
		UserAgent:   userAgent,
		IPAddress:   ipAddress,
		Device:      device,
		OS:          os,
		Browser:     browser,
		UTMSource:   request.UTMSource,
		UTMMedium:   request.UTMMedium,
		UTMCampaign: request.UTMCampaign,
		UTMContent:  request.UTMContent,
		UTMTerm:     request.UTMTerm,
		Timestamp:   time.Now(),
		CreatedAt:   time.Now(),
	}

	// Save to database
	if _, err := h.db.Client.Collection("page_visits").Doc(visit.ID).Set(h.db.Context, visit); err != nil {
		log.Printf("Failed to save page visit: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track visit"})
		return
	}

	// Update or create user session
	go h.updateUserSession(request.SessionID, request.UserID, request.Page, visit)

	c.JSON(http.StatusOK, gin.H{"status": "tracked"})
}

// Track user action (add to cart, purchase, etc.)
func (h *AnalyticsHandler) TrackUserAction(c *gin.Context) {
	var request struct {
		SessionID   string                 `json:"session_id" binding:"required"`
		UserID      string                 `json:"user_id,omitempty"`
		Action      string                 `json:"action" binding:"required"` // view_product, add_to_cart, checkout, purchase
		Page        string                 `json:"page,omitempty"`
		ProductID   string                 `json:"product_id,omitempty"`
		Category    string                 `json:"category,omitempty"`
		Value       float64                `json:"value,omitempty"`
		Metadata    map[string]interface{} `json:"metadata,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	action := &models.UserAction{
		ID:        utils.GenerateIDWithPrefix("action"),
		SessionID: request.SessionID,
		UserID:    request.UserID,
		Action:    request.Action,
		Page:      request.Page,
		ProductID: request.ProductID,
		Category:  request.Category,
		Value:     request.Value,
		Metadata:  request.Metadata,
		Timestamp: time.Now(),
		CreatedAt: time.Now(),
	}

	if _, err := h.db.Client.Collection("user_actions").Doc(action.ID).Set(h.db.Context, action); err != nil {
		log.Printf("Failed to save user action: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track action"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "tracked"})
}

// Get analytics summary for admin dashboard
func (h *AnalyticsHandler) GetAnalyticsSummary(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	
	// Calculate date range
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -days)
	
	summary := &models.AnalyticsSummary{
		TrafficSources:   make(map[string]int),
		DeviceBreakdown:  make(map[string]int),
		CountryBreakdown: make(map[string]int),
		CampaignMetrics:  make(map[string]models.CampaignMetric),
		DateRange:        fmt.Sprintf("%s to %s", startDate.Format("Jan 2"), endDate.Format("Jan 2")),
	}

	// Get page visits in date range
	visitQuery := h.db.Client.Collection("page_visits").
		Where("timestamp", ">=", startDate).
		Where("timestamp", "<=", endDate)
	
	visitDocs, err := visitQuery.Documents(h.db.Context).GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch analytics"})
		return
	}

	// Process visits
	sessionIDs := make(map[string]bool)
	
	for _, doc := range visitDocs {
		var visit models.PageVisit
		doc.DataTo(&visit)
		
		summary.TotalVisits++
		sessionIDs[visit.SessionID] = true
		
		// Traffic sources
		source := visit.UTMSource
		if source == "" {
			if visit.Referrer != "" {
				if strings.Contains(visit.Referrer, "instagram") {
					source = "instagram"
				} else if strings.Contains(visit.Referrer, "google") {
					source = "google"
				} else if strings.Contains(visit.Referrer, "facebook") {
					source = "facebook"
				} else {
					source = "referral"
				}
			} else {
				source = "direct"
			}
		}
		summary.TrafficSources[source]++
		
		// Device breakdown
		if visit.Device != "" {
			summary.DeviceBreakdown[visit.Device]++
		}
		
		// Country breakdown
		if visit.Country != "" {
			summary.CountryBreakdown[visit.Country]++
		}
		
		// Campaign metrics
		if visit.UTMCampaign != "" {
			metric := summary.CampaignMetrics[visit.UTMCampaign]
			metric.Visits++
			summary.CampaignMetrics[visit.UTMCampaign] = metric
		}
	}
	
	summary.UniqueVisitors = len(sessionIDs)
	
	// Get conversion data
	actionQuery := h.db.Client.Collection("user_actions").
		Where("timestamp", ">=", startDate).
		Where("timestamp", "<=", endDate).
		Where("action", "==", "purchase")
	
	actionDocs, err := actionQuery.Documents(h.db.Context).GetAll()
	if err == nil {
		for _, doc := range actionDocs {
			var action models.UserAction
			doc.DataTo(&action)
			
			summary.TotalOrders++
			summary.Revenue += action.Value
		}
	}
	
	// Calculate conversion rate
	if summary.UniqueVisitors > 0 {
		summary.ConversionRate = float64(summary.TotalOrders) / float64(summary.UniqueVisitors) * 100
	}

	c.JSON(http.StatusOK, summary)
}

// Get Instagram ad performance
func (h *AnalyticsHandler) GetInstagramAdPerformance(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "7"))
	
	// Calculate date range
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -days)
	
	// Get Instagram traffic
	visitQuery := h.db.Client.Collection("page_visits").
		Where("timestamp", ">=", startDate).
		Where("timestamp", "<=", endDate).
		Where("utm_source", "==", "instagram")
	
	visitDocs, err := visitQuery.Documents(h.db.Context).GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch Instagram data"})
		return
	}

	campaignPerformance := make(map[string]*models.InstagramAdPerformance)
	
	for _, doc := range visitDocs {
		var visit models.PageVisit
		doc.DataTo(&visit)
		
		campaign := visit.UTMCampaign
		if campaign == "" {
			campaign = "Unknown Campaign"
		}
		
		if _, exists := campaignPerformance[campaign]; !exists {
			campaignPerformance[campaign] = &models.InstagramAdPerformance{
				CampaignName: campaign,
				AdContent:    visit.UTMContent,
				Date:         startDate.Format("2006-01-02"),
				CreatedAt:    time.Now(),
			}
		}
		
		campaignPerformance[campaign].Clicks++
	}

	// Convert map to slice
	performance := make([]models.InstagramAdPerformance, 0)
	for _, perf := range campaignPerformance {
		if perf.Clicks > 0 {
			perf.RevenuePerClick = perf.Revenue / float64(perf.Clicks)
			if perf.Clicks > 0 {
				perf.ConversionRate = float64(perf.Conversions) / float64(perf.Clicks) * 100
			}
		}
		performance = append(performance, *perf)
	}

	c.JSON(http.StatusOK, gin.H{
		"instagram_performance": performance,
		"date_range": fmt.Sprintf("%s to %s", startDate.Format("Jan 2"), endDate.Format("Jan 2")),
		"total_instagram_clicks": len(visitDocs),
	})
}

// Helper functions
func getDeviceType(userAgent string) string {
	ua := strings.ToLower(userAgent)
	if strings.Contains(ua, "mobile") || strings.Contains(ua, "android") || strings.Contains(ua, "iphone") {
		return "mobile"
	} else if strings.Contains(ua, "tablet") || strings.Contains(ua, "ipad") {
		return "tablet"
	}
	return "desktop"
}

func getOSType(userAgent string) string {
	ua := strings.ToLower(userAgent)
	if strings.Contains(ua, "android") {
		return "Android"
	} else if strings.Contains(ua, "iphone") || strings.Contains(ua, "ipad") || strings.Contains(ua, "ios") {
		return "iOS"
	} else if strings.Contains(ua, "windows") {
		return "Windows"
	} else if strings.Contains(ua, "mac") {
		return "macOS"
	} else if strings.Contains(ua, "linux") {
		return "Linux"
	}
	return "Unknown"
}

func getBrowserType(userAgent string) string {
	ua := strings.ToLower(userAgent)
	if strings.Contains(ua, "chrome") {
		return "Chrome"
	} else if strings.Contains(ua, "safari") && !strings.Contains(ua, "chrome") {
		return "Safari"
	} else if strings.Contains(ua, "firefox") {
		return "Firefox"
	} else if strings.Contains(ua, "edge") {
		return "Edge"
	}
	return "Unknown"
}

func getClientIP(c *gin.Context) string {
	// Try various headers for real IP
	forwarded := c.GetHeader("X-Forwarded-For")
	if forwarded != "" {
		return strings.Split(forwarded, ",")[0]
	}
	
	real := c.GetHeader("X-Real-IP")
	if real != "" {
		return real
	}
	
	return c.ClientIP()
}

// Update user session with new activity
func (h *AnalyticsHandler) updateUserSession(sessionID, userID, page string, visit *models.PageVisit) {
	// Check if session exists
	sessionDoc := h.db.Client.Collection("user_sessions").Doc(sessionID)
	docSnap, err := sessionDoc.Get(h.db.Context)
	
	if err != nil {
		// Create new session
		session := &models.UserSession{
			ID:           sessionID,
			SessionID:    sessionID,
			UserID:       userID,
			StartTime:    time.Now(),
			LastActivity: time.Now(),
			Duration:     0,
			PageViews:    1,
			LandingPage:  page,
			UTMSource:    visit.UTMSource,
			UTMMedium:    visit.UTMMedium,
			UTMCampaign:  visit.UTMCampaign,
			Device:       visit.Device,
			OS:           visit.OS,
			Browser:      visit.Browser,
			Country:      visit.Country,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		
		sessionDoc.Set(h.db.Context, session)
	} else {
		// Update existing session
		var session models.UserSession
		docSnap.DataTo(&session)
		
		duration := int(time.Since(session.StartTime).Seconds())
		
		sessionDoc.Update(h.db.Context, []firestore.Update{
			{Path: "last_activity", Value: time.Now()},
			{Path: "duration", Value: duration},
			{Path: "page_views", Value: session.PageViews + 1},
			{Path: "updated_at", Value: time.Now()},
		})
	}
}