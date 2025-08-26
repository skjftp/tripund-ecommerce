package handlers

import (
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type ProxyHandler struct {
	client *http.Client
}

func NewProxyHandler() *ProxyHandler {
	return &ProxyHandler{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ProxyFPL proxies requests to Fantasy Premier League API
func (h *ProxyHandler) ProxyFPL(c *gin.Context) {
	// Get the path parameter
	path := c.Param("path")
	if path == "" {
		path = "bootstrap-static"
	}

	// Construct the FPL API URL
	fplURL := "https://fantasy.premierleague.com/api/" + path + "/"

	// Create the request
	req, err := http.NewRequest("GET", fplURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	// Set headers to mimic a regular browser request
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "application/json")

	// Make the request
	resp, err := h.client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch data from FPL"})
		return
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response"})
		return
	}

	// Return the response with proper headers
	c.Data(resp.StatusCode, "application/json", body)
}