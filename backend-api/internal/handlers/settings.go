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

	_, err := h.db.Client.Collection("settings").Doc("store").Set(h.db.Context, settings, firestore.MergeAll)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Settings updated successfully",
		"settings": settings,
	})
}