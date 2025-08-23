package handlers

import (
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"tripund-api/internal/database"
)

type SettingsHandler struct {
	db *database.Firebase
}

func NewSettingsHandler(db *database.Firebase) *SettingsHandler {
	return &SettingsHandler{db: db}
}

type Settings struct {
	General  GeneralSettings  `json:"general" firestore:"general"`
	Shipping ShippingSettings `json:"shipping" firestore:"shipping"`
	Payment  PaymentSettings  `json:"payment" firestore:"payment"`
	UpdatedAt time.Time       `json:"updated_at" firestore:"updated_at"`
}

type GeneralSettings struct {
	StoreName        string `json:"store_name" firestore:"store_name"`
	StoreEmail       string `json:"store_email" firestore:"store_email"`
	StorePhone       string `json:"store_phone" firestore:"store_phone"`
	StoreAddress     string `json:"store_address" firestore:"store_address"`
	Currency         string `json:"currency" firestore:"currency"`
	MaintenanceMode  bool   `json:"maintenance_mode" firestore:"maintenance_mode"`
}

type ShippingSettings struct {
	FreeShippingThreshold float64  `json:"free_shipping_threshold" firestore:"free_shipping_threshold"`
	StandardShippingRate  float64  `json:"standard_shipping_rate" firestore:"standard_shipping_rate"`
	ExpressShippingRate   float64  `json:"express_shipping_rate" firestore:"express_shipping_rate"`
	ProcessingTime        int      `json:"processing_time" firestore:"processing_time"`
	DeliveryZones         []string `json:"delivery_zones" firestore:"delivery_zones"`
}

type PaymentSettings struct {
	RazorpayEnabled    bool    `json:"razorpay_enabled" firestore:"razorpay_enabled"`
	RazorpayKey        string  `json:"razorpay_key" firestore:"razorpay_key"`
	CODEnabled         bool    `json:"cod_enabled" firestore:"cod_enabled"`
	CODLimit           float64 `json:"cod_limit" firestore:"cod_limit"`
	TaxRate            float64 `json:"tax_rate" firestore:"tax_rate"`
	PrepaidDiscount    float64 `json:"prepaid_discount" firestore:"prepaid_discount"`
}

// GetPublicSettings retrieves public settings (shipping rates, tax, etc) for frontend use
func (h *SettingsHandler) GetPublicSettings(c *gin.Context) {
	doc, err := h.db.Client.Collection("settings").Doc("store").Get(h.db.Context)
	
	// Default settings if not found
	defaultSettings := map[string]interface{}{
		"shipping": map[string]interface{}{
			"free_shipping_threshold": 5000.0,
			"standard_shipping_rate":  100.0,
			"express_shipping_rate":   200.0,
		},
		"payment": map[string]interface{}{
			"tax_rate":         18.0,
			"prepaid_discount": 5.0,
			"cod_enabled":      true,
			"cod_limit":        10000.0,
		},
		"general": map[string]interface{}{
			"currency": "INR",
		},
	}
	
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"settings": defaultSettings})
		return
	}

	var settings Settings
	if err := doc.DataTo(&settings); err != nil {
		c.JSON(http.StatusOK, gin.H{"settings": defaultSettings})
		return
	}

	// Return only public settings
	publicSettings := map[string]interface{}{
		"shipping": map[string]interface{}{
			"free_shipping_threshold": settings.Shipping.FreeShippingThreshold,
			"standard_shipping_rate":  settings.Shipping.StandardShippingRate,
			"express_shipping_rate":   settings.Shipping.ExpressShippingRate,
		},
		"payment": map[string]interface{}{
			"tax_rate":         settings.Payment.TaxRate,
			"prepaid_discount": settings.Payment.PrepaidDiscount,
			"cod_enabled":      settings.Payment.CODEnabled,
			"cod_limit":        settings.Payment.CODLimit,
		},
		"general": map[string]interface{}{
			"currency": settings.General.Currency,
		},
	}

	c.JSON(http.StatusOK, gin.H{"settings": publicSettings})
}

// GetSettings retrieves the current settings
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	doc, err := h.db.Client.Collection("settings").Doc("store").Get(h.db.Context)
	if err != nil {
		// If settings don't exist, return default settings
		defaultSettings := Settings{
			General: GeneralSettings{
				StoreName:    "TRIPUND Lifestyle",
				StoreEmail:   "support@tripundlifestyle.com",
				StorePhone:   "+91 9999999999",
				StoreAddress: "Mumbai, India",
				Currency:     "INR",
			},
			Shipping: ShippingSettings{
				FreeShippingThreshold: 5000,
				StandardShippingRate:  100,
				ExpressShippingRate:   200,
				ProcessingTime:        2,
				DeliveryZones:         []string{"Mumbai", "Delhi", "Bangalore", "Chennai"},
			},
			Payment: PaymentSettings{
				RazorpayEnabled: true,
				CODEnabled:      true,
				CODLimit:        10000,
				TaxRate:         18,
				PrepaidDiscount: 5,
			},
			UpdatedAt: time.Now(),
		}
		c.JSON(http.StatusOK, gin.H{"settings": defaultSettings})
		return
	}

	var settings Settings
	if err := doc.DataTo(&settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"settings": settings})
}

// UpdateSettings updates the store settings
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	var settings Settings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	settings.UpdatedAt = time.Now()

	// Convert struct to map for MergeAll
	data := map[string]interface{}{
		"general":    settings.General,
		"shipping":   settings.Shipping,
		"payment":    settings.Payment,
		"updated_at": settings.UpdatedAt,
	}

	_, err := h.db.Client.Collection("settings").Doc("store").Set(h.db.Context, data, firestore.MergeAll)
	if err != nil {
		// Log the actual error for debugging
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update settings",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Settings updated successfully",
		"settings": settings,
	})
}