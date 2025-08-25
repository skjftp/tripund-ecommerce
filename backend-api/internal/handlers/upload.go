package handlers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UploadHandler struct {
	bucketName string
	client     *storage.Client
}

func NewUploadHandler() (*UploadHandler, error) {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create storage client: %v", err)
	}

	return &UploadHandler{
		bucketName: "tripund-product-images",
		client:     client,
	}, nil
}

func (h *UploadHandler) UploadImage(c *gin.Context) {
	// Parse multipart form
	err := c.Request.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Get the file from form
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get image from form"})
		return
	}
	defer file.Close()

	// Validate file type
	contentType := header.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		// Try to detect from extension
		ext := strings.ToLower(filepath.Ext(header.Filename))
		switch ext {
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".png":
			contentType = "image/png"
		case ".gif":
			contentType = "image/gif"
		case ".webp":
			contentType = "image/webp"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type"})
			return
		}
	}

	// Get the upload type (products or categories)
	uploadType := c.Request.FormValue("type")
	if uploadType == "" {
		uploadType = "products"
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	uniqueID := uuid.New().String()
	timestamp := time.Now().Unix()
	fileName := fmt.Sprintf("%s/%s-%d%s", uploadType, uniqueID, timestamp, ext)

	// Upload to GCS
	ctx := context.Background()
	bucket := h.client.Bucket(h.bucketName)
	obj := bucket.Object(fileName)
	writer := obj.NewWriter(ctx)
	writer.ContentType = contentType
	writer.CacheControl = "public, max-age=3600"

	// Copy file to GCS
	if _, err := io.Copy(writer, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image"})
		return
	}

	if err := writer.Close(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	// Generate URLs
	gcsURL := fmt.Sprintf("https://storage.googleapis.com/%s/%s", h.bucketName, fileName)
	cdnURL := fmt.Sprintf("https://images.tripundlifestyle.com/%s", fileName)

	c.JSON(http.StatusOK, gin.H{
		"url":     gcsURL,
		"cdn_url": cdnURL,
		"path":    fileName,
		"size":    header.Size,
		"type":    contentType,
	})
}

func (h *UploadHandler) DeleteImage(c *gin.Context) {
	path := c.Param("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Path is required"})
		return
	}

	ctx := context.Background()
	bucket := h.client.Bucket(h.bucketName)
	obj := bucket.Object(path)

	if err := obj.Delete(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}