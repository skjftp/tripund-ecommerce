package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AppHandler struct{}

type AppVersionResponse struct {
	Version      string `json:"version"`
	BuildNumber  int    `json:"build_number"`
	DownloadURL  string `json:"download_url"`
	ReleaseNotes string `json:"release_notes"`
	ForceUpdate  bool   `json:"force_update"`
	MinVersion   string `json:"min_version,omitempty"`
}

func NewAppHandler() *AppHandler {
	return &AppHandler{}
}

// GetVersion returns the current app version information for auto-update
func (h *AppHandler) GetVersion(c *gin.Context) {
	// Current version information for TRIPUND Mobile
	versionInfo := AppVersionResponse{
		Version:     "1.0.21",
		BuildNumber: 22,
		DownloadURL: "https://github.com/skjftp/tripund-ecommerce/releases/download/v1.0.21/app-release.apk",
		ReleaseNotes: "🎉 Major Update v1.0.21!\n" +
			"✅ Complete cart persistence - never lose your items\n" +
			"✅ Fixed authentication tokens for all API calls\n" +
			"✅ Dynamic payment settings from backend\n" +
			"✅ Cash on Delivery (COD) option with limits\n" +
			"✅ GPS location for easy address filling\n" +
			"✅ Fixed order creation flow\n" +
			"✅ Improved checkout experience\n" +
			"🔧 Fixed critical bugs in payment processing",
		ForceUpdate: false,
		MinVersion:  "1.0.0",
	}

	c.JSON(http.StatusOK, versionInfo)
}

// UpdateVersion allows admin to update version information (for future use)
func (h *AppHandler) UpdateVersion(c *gin.Context) {
	var req AppVersionResponse
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// In a real implementation, you would save this to database
	// For now, we'll just return success
	c.JSON(http.StatusOK, gin.H{
		"message": "Version information updated successfully",
		"data":    req,
	})
}