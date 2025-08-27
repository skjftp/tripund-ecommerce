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
	
	promotionHandler := handlers.NewPromotionHandler(db)
	invoiceHandler := handlers.NewInvoiceHandler(db)

	api := r.Group("/api/v1")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "healthy"})
		})

		// App version endpoint for auto-update functionality
		api.GET("/app/version", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"version":       "1.0.8",
				"build_number":  9,
				"download_url":  "https://github.com/skjftp/tripund-ecommerce/releases/download/v1.0.8/tripund-v1.0.8.apk",
				"release_notes": "🧹 Production Ready Release!\n✅ Cleaned up debug logging for production\n✅ Optimized product loading performance\n✅ Simplified API data parsing\n✅ Reduced console noise\n✅ Improved app stability\n🚀 Ready for production deployment\n📱 Smaller app size with optimized builds",
				"force_update":  false,
				"min_version":   "1.0.0",
			})
		})
		
		// Simple test endpoint
		api.GET("/test", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "test endpoint working", "version": "1.0.1"})
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
		
		// Promotion validation (public)
		api.POST("/promotions/validate", promotionHandler.ValidatePromotion)

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
			
			// Invoice endpoints (for logged-in users)
			invoices := protected.Group("/invoices")
			{
				invoices.GET("", invoiceHandler.ListInvoices)
				invoices.GET("/:id", invoiceHandler.GetInvoice)
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
			
			// Email template management (admin only)
			emailTemplateHandler := handlers.NewEmailTemplateHandler(db)
			admin.GET("/email-templates", emailTemplateHandler.GetTemplates)
			admin.GET("/email-templates/predefined", emailTemplateHandler.GetPredefinedTemplates)
			admin.GET("/email-templates/:id", emailTemplateHandler.GetTemplate)
			admin.POST("/email-templates", emailTemplateHandler.CreateTemplate)
			admin.PUT("/email-templates/:id", emailTemplateHandler.UpdateTemplate)
			admin.DELETE("/email-templates/:id", emailTemplateHandler.DeleteTemplate)
			admin.POST("/email-templates/:id/set-default", emailTemplateHandler.SetDefaultTemplate)
			admin.POST("/email-templates/test", emailTemplateHandler.TestTemplate)
			
			
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
			
			// Promotion management (admin only)
			admin.GET("/promotions", promotionHandler.GetPromotions)
			admin.POST("/promotions", promotionHandler.CreatePromotion)
			admin.PUT("/promotions/:id", promotionHandler.UpdatePromotion)
			admin.DELETE("/promotions/:id", promotionHandler.DeletePromotion)
			admin.POST("/promotions/initialize", promotionHandler.InitializeDefaultPromotions)
			
			// Invoice management (admin only)
			admin.GET("/invoices", invoiceHandler.ListInvoices)
			admin.GET("/invoices/:id", invoiceHandler.GetInvoice)
			admin.POST("/invoices/generate", invoiceHandler.GenerateInvoice)
			admin.POST("/invoices/bulk-generate", invoiceHandler.BulkGenerateInvoices)
			admin.PUT("/invoices/:id/status", invoiceHandler.UpdateInvoiceStatus)
			admin.DELETE("/invoices/:id", invoiceHandler.DeleteInvoice)
			admin.GET("/invoices/stats", invoiceHandler.GetInvoiceStats)
		}

		api.POST("/webhook/razorpay", paymentHandler.RazorpayWebhook)
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}