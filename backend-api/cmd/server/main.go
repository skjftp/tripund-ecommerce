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
	settingsHandler := handlers.NewSettingsHandler(db)
	notificationHandler := handlers.NewNotificationHandler(db)
	contactHandler := handlers.NewContactHandler(db)
	
	uploadHandler, err := handlers.NewUploadHandler()
	if err != nil {
		log.Printf("Warning: Failed to initialize upload handler: %v", err)
	}

	api := r.Group("/api/v1")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "healthy"})
		})

		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
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

		// Public settings endpoint (for shipping rates, tax, etc)
		api.GET("/settings/public", settingsHandler.GetPublicSettings)
		
		// Contact form submission (public)
		api.POST("/contact", contactHandler.SubmitContactMessage)

		// Guest checkout endpoints (no authentication required)
		api.POST("/guest/orders", orderHandler.CreateGuestOrder)
		api.GET("/guest/orders", orderHandler.GetGuestOrders) // Get guest orders by email
		api.GET("/guest/orders/:id", orderHandler.GetGuestOrder)
		api.POST("/guest/payment/create-order", paymentHandler.CreateGuestRazorpayOrder)
		api.POST("/guest/payment/verify", paymentHandler.VerifyGuestPayment)

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
			admin.PATCH("/orders/:id/status", orderHandler.UpdateOrderStatus)

			// User/Customer management (admin only)
			admin.GET("/users", authHandler.GetAllUsers)
			admin.GET("/users/:id", authHandler.GetUserDetails)

			// Payment management (admin only)
			admin.GET("/payments", paymentHandler.GetAllPayments)

			// Content management endpoints (admin only)
			admin.GET("/content/:type", contentHandler.GetContentAdmin)
			admin.PUT("/content/:type", contentHandler.UpdateContent)
			
			// FAQ management
			admin.PUT("/faqs", contentHandler.UpdateFAQs)
			
			
			// Settings management
			admin.GET("/settings", settingsHandler.GetSettings)
			admin.PUT("/settings", settingsHandler.UpdateSettings)
			
			// Notifications management
			admin.GET("/notifications", notificationHandler.GetNotifications)
			admin.PUT("/notifications/:id/read", notificationHandler.MarkAsRead)
			admin.PUT("/notifications/read-all", notificationHandler.MarkAllAsRead)
			admin.DELETE("/notifications/:id", notificationHandler.DeleteNotification)
			admin.DELETE("/notifications", notificationHandler.ClearAllNotifications)
			
			// Contact messages management (admin only)
			admin.GET("/contact-messages", contactHandler.GetContactMessages)
			admin.GET("/contact-messages/:id", contactHandler.GetContactMessage)
			admin.PUT("/contact-messages/:id", contactHandler.UpdateContactMessage)
			admin.DELETE("/contact-messages/:id", contactHandler.DeleteContactMessage)
			
			// Image upload endpoints (admin only)
			if uploadHandler != nil {
				admin.POST("/upload/image", uploadHandler.UploadImage)
				admin.DELETE("/upload/image/*path", uploadHandler.DeleteImage)
			}
		}

		api.POST("/webhook/razorpay", paymentHandler.RazorpayWebhook)
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}