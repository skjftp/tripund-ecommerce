package models

import "time"

// PageVisit tracks individual page visits with UTM parameters
type PageVisit struct {
	ID            string    `firestore:"id" json:"id"`
	SessionID     string    `firestore:"session_id" json:"session_id"`
	UserID        string    `firestore:"user_id,omitempty" json:"user_id,omitempty"`
	Page          string    `firestore:"page" json:"page"`
	Referrer      string    `firestore:"referrer,omitempty" json:"referrer,omitempty"`
	UserAgent     string    `firestore:"user_agent,omitempty" json:"user_agent,omitempty"`
	IPAddress     string    `firestore:"ip_address,omitempty" json:"ip_address,omitempty"`
	Country       string    `firestore:"country,omitempty" json:"country,omitempty"`
	City          string    `firestore:"city,omitempty" json:"city,omitempty"`
	Device        string    `firestore:"device,omitempty" json:"device,omitempty"` // mobile, desktop, tablet
	OS            string    `firestore:"os,omitempty" json:"os,omitempty"`
	Browser       string    `firestore:"browser,omitempty" json:"browser,omitempty"`
	
	// UTM Parameters for ad tracking
	UTMSource     string    `firestore:"utm_source,omitempty" json:"utm_source,omitempty"`         // instagram, facebook, google
	UTMMedium     string    `firestore:"utm_medium,omitempty" json:"utm_medium,omitempty"`         // social, cpc, organic
	UTMCampaign   string    `firestore:"utm_campaign,omitempty" json:"utm_campaign,omitempty"`     // campaign name
	UTMContent    string    `firestore:"utm_content,omitempty" json:"utm_content,omitempty"`       // ad content
	UTMTerm       string    `firestore:"utm_term,omitempty" json:"utm_term,omitempty"`             // keyword
	
	Timestamp     time.Time `firestore:"timestamp" json:"timestamp"`
	CreatedAt     time.Time `firestore:"created_at" json:"created_at"`
}

// UserSession tracks user sessions and behavior
type UserSession struct {
	ID            string    `firestore:"id" json:"id"`
	SessionID     string    `firestore:"session_id" json:"session_id"`
	UserID        string    `firestore:"user_id,omitempty" json:"user_id,omitempty"`
	
	// Session Info
	StartTime     time.Time `firestore:"start_time" json:"start_time"`
	LastActivity  time.Time `firestore:"last_activity" json:"last_activity"`
	Duration      int       `firestore:"duration" json:"duration"` // seconds
	PageViews     int       `firestore:"page_views" json:"page_views"`
	IsConverted   bool      `firestore:"is_converted" json:"is_converted"` // purchased something
	OrderValue    float64   `firestore:"order_value,omitempty" json:"order_value,omitempty"`
	
	// Traffic Source
	LandingPage   string    `firestore:"landing_page" json:"landing_page"`
	UTMSource     string    `firestore:"utm_source,omitempty" json:"utm_source,omitempty"`
	UTMMedium     string    `firestore:"utm_medium,omitempty" json:"utm_medium,omitempty"`
	UTMCampaign   string    `firestore:"utm_campaign,omitempty" json:"utm_campaign,omitempty"`
	
	// Device Info
	Device        string    `firestore:"device,omitempty" json:"device,omitempty"`
	OS            string    `firestore:"os,omitempty" json:"os,omitempty"`
	Browser       string    `firestore:"browser,omitempty" json:"browser,omitempty"`
	Country       string    `firestore:"country,omitempty" json:"country,omitempty"`
	
	CreatedAt     time.Time `firestore:"created_at" json:"created_at"`
	UpdatedAt     time.Time `firestore:"updated_at" json:"updated_at"`
}

// UserAction tracks specific user actions
type UserAction struct {
	ID            string    `firestore:"id" json:"id"`
	SessionID     string    `firestore:"session_id" json:"session_id"`
	UserID        string    `firestore:"user_id,omitempty" json:"user_id,omitempty"`
	Action        string    `firestore:"action" json:"action"` // view_product, add_to_cart, checkout, purchase
	Page          string    `firestore:"page,omitempty" json:"page,omitempty"`
	ProductID     string    `firestore:"product_id,omitempty" json:"product_id,omitempty"`
	Category      string    `firestore:"category,omitempty" json:"category,omitempty"`
	Value         float64   `firestore:"value,omitempty" json:"value,omitempty"` // cart value, order value
	Metadata      map[string]interface{} `firestore:"metadata,omitempty" json:"metadata,omitempty"`
	Timestamp     time.Time `firestore:"timestamp" json:"timestamp"`
	CreatedAt     time.Time `firestore:"created_at" json:"created_at"`
}

// AnalyticsSummary for dashboard display
type AnalyticsSummary struct {
	// Traffic Overview
	TotalVisits        int     `json:"total_visits"`
	UniqueVisitors     int     `json:"unique_visitors"`
	BounceRate         float64 `json:"bounce_rate"`
	AvgSessionDuration int     `json:"avg_session_duration"`
	
	// Source Breakdown
	TrafficSources map[string]int `json:"traffic_sources"` // instagram: 120, organic: 45, etc.
	
	// Conversion Metrics  
	ConversionRate     float64 `json:"conversion_rate"`
	TotalOrders        int     `json:"total_orders"`
	Revenue            float64 `json:"revenue"`
	
	// Demographics
	DeviceBreakdown    map[string]int `json:"device_breakdown"`   // mobile: 80%, desktop: 20%
	CountryBreakdown   map[string]int `json:"country_breakdown"`  // India: 95%, USA: 3%
	
	// Campaign Performance
	CampaignMetrics    map[string]CampaignMetric `json:"campaign_metrics"`
	
	DateRange          string `json:"date_range"`
}

type CampaignMetric struct {
	Visits      int     `json:"visits"`
	Conversions int     `json:"conversions"`
	Revenue     float64 `json:"revenue"`
	CPC         float64 `json:"cpc,omitempty"` // if available
}

// InstagramAdPerformance specific tracking
type InstagramAdPerformance struct {
	CampaignName   string    `json:"campaign_name"`
	AdContent      string    `json:"ad_content,omitempty"`
	Clicks         int       `json:"clicks"`
	Conversions    int       `json:"conversions"`
	Revenue        float64   `json:"revenue"`
	ConversionRate float64   `json:"conversion_rate"`
	RevenuePerClick float64  `json:"revenue_per_click"`
	TopProducts    []string  `json:"top_products"` // Most viewed products from this campaign
	Date           string    `json:"date"`
	CreatedAt      time.Time `json:"created_at"`
}