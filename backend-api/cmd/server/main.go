package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"tripund-api/internal/config"
	"tripund-api/internal/database"
	"tripund-api/internal/handlers"
	"tripund-api/internal/middleware"
)

func main() {
	cfg := config.Load()

	gin.SetMode(cfg.GinMode)
	
	db, err := database.NewFirebase(cfg)
	if err != nil {
		log.Fatal("Failed to initialize Firebase:", err)
	}
	defer db.Close()

	r := gin.Default()

	r.Use(middleware.CORSMiddleware(cfg.CORSOrigin))

	authHandler := handlers.NewAuthHandler(db, cfg.JWTSecret)
	productHandler := handlers.NewProductHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db, cfg.RazorpayKeyID, cfg.RazorpayKeySecret, cfg.RazorpayWebhookSecret)
	orderHandler := handlers.NewOrderHandler(db)
	categoryHandler := handlers.NewCategoryHandler(db)
	contentHandler := handlers.NewContentHandler(db)

	api := r.Group("/api/v1")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "healthy"})
		})

		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		products := api.Group("/products")
		{
			products.GET("", productHandler.GetProducts)
			products.GET("/:id", productHandler.GetProduct)
			products.GET("/search", productHandler.SearchProducts)
		}

		categories := api.Group("/categories")
		{
			categories.GET("", categoryHandler.GetCategories)
			categories.GET("/:id", categoryHandler.GetCategory)
		}

		// Public content endpoints
		content := api.Group("/content")
		{
			content.GET("/:type", contentHandler.GetContent)
			content.GET("/faqs/list", contentHandler.GetFAQs)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			protected.GET("/profile", authHandler.GetProfile)
			protected.PUT("/profile", authHandler.UpdateProfile)

			// Order endpoints
			orders := protected.Group("/orders")
			{
				orders.POST("", orderHandler.CreateOrder)
				orders.GET("", orderHandler.GetUserOrders)
				orders.GET("/:id", orderHandler.GetOrder)
			}

			payment := protected.Group("/payment")
			{
				payment.POST("/create-order", paymentHandler.CreateRazorpayOrder)
				payment.POST("/verify", paymentHandler.VerifyPayment)
			}
		}

		// Admin auth routes (no middleware)
		adminAuth := api.Group("/admin/auth")
		{
			adminAuth.POST("/login", authHandler.AdminLogin)
		}

		// Protected admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(cfg.JWTSecret), middleware.AdminMiddleware())
		{
			admin.POST("/products", productHandler.CreateProduct)
			admin.PUT("/products/:id", productHandler.UpdateProduct)
			admin.DELETE("/products/:id", productHandler.DeleteProduct)

			admin.POST("/categories", categoryHandler.CreateCategory)
			admin.PUT("/categories/:id", categoryHandler.UpdateCategory)
			admin.DELETE("/categories/:id", categoryHandler.DeleteCategory)
			admin.POST("/categories/initialize", categoryHandler.InitializeDefaultCategories)

			// Order management (admin only)
			admin.GET("/orders", orderHandler.GetAllOrders)
			admin.PUT("/orders/:id/status", orderHandler.UpdateOrderStatus)

			// Content management endpoints (admin only)
			admin.PUT("/content/:type", contentHandler.UpdateContent)
			admin.GET("/content", contentHandler.GetAllContent)
			
			// FAQ management
			admin.POST("/faqs", contentHandler.CreateFAQ)
			admin.PUT("/faqs/:id", contentHandler.UpdateFAQ)
			admin.DELETE("/faqs/:id", contentHandler.DeleteFAQ)
			
			// Initialize default content
			admin.POST("/content/initialize", func(c *gin.Context) {
				if err := db.InitializeDefaultContent(); err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				c.JSON(200, gin.H{"message": "Default content initialized successfully"})
			})
		}

		api.POST("/webhook/razorpay", paymentHandler.RazorpayWebhook)
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}