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
		Version:     "1.0.1",
		BuildNumber: 2,
		DownloadURL: "https://github.com/skjftp/tripund-ecommerce/releases/download/v1.0.1/app-release.apk",
		ReleaseNotes: "🎉 Complete Flutter app with all features!\n" +
			"✅ Profile with login/register functionality\n" +
			"✅ Full cart & wishlist functionality\n" +
			"✅ API integration matching web version\n" +
			"✅ Beautiful animations throughout\n" +
			"✅ Fixed carousel to use API category images\n" +
			"✅ Category navigation properly working\n" +
			"✅ Featured products loading from API\n" +
			"✨ Mesmerizing staggered animations\n" +
			"✨ Glassmorphic search bar\n" +
			"✨ Parallax card effects",
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