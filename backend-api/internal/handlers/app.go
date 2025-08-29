package handlers

import (
	"net/http"
	"os"
	"strconv"

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
	// Get version info from environment variables with defaults
	version := os.Getenv("APP_VERSION")
	if version == "" {
		version = "1.0.22"
	}
	
	buildNumberStr := os.Getenv("APP_BUILD_NUMBER")
	buildNumber := 22
	if buildNumberStr != "" {
		if num, err := strconv.Atoi(buildNumberStr); err == nil {
			buildNumber = num
		}
	}
	
	downloadURL := os.Getenv("APP_DOWNLOAD_URL")
	if downloadURL == "" {
		downloadURL = "https://github.com/skjftp/tripund-ecommerce/releases/download/v" + version + "/tripund-v" + version + ".apk"
	}
	
	releaseNotes := os.Getenv("APP_RELEASE_NOTES")
	if releaseNotes == "" {
		releaseNotes = "🎉 Major Update v" + version + "!\n" +
			"✨ Brand new app icon\n" +
			"🎁 Real promo codes from backend\n" +
			"🔄 Smooth tab switching animation\n" +
			"🛒 Improved cart and wishlist functionality\n" +
			"📱 Better share functionality\n" +
			"✅ All previous fixes included\n" +
			"🚀 Enhanced performance and stability"
	}
	
	forceUpdateStr := os.Getenv("APP_FORCE_UPDATE")
	forceUpdate := false
	if forceUpdateStr == "true" {
		forceUpdate = true
	}
	
	minVersion := os.Getenv("APP_MIN_VERSION")
	if minVersion == "" {
		minVersion = "1.0.0"
	}
	
	versionInfo := AppVersionResponse{
		Version:      version,
		BuildNumber:  buildNumber,
		DownloadURL:  downloadURL,
		ReleaseNotes: releaseNotes,
		ForceUpdate:  forceUpdate,
		MinVersion:   minVersion,
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