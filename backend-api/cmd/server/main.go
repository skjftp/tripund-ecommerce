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
	paymentHandler := handlers.NewPaymentHandler(db, cfg.RazorpayKeyID, cfg.RazorpayKeySecret)

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

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			protected.GET("/profile", authHandler.GetProfile)
			protected.PUT("/profile", authHandler.UpdateProfile)

			payment := protected.Group("/payment")
			{
				payment.POST("/create-order", paymentHandler.CreateRazorpayOrder)
				payment.POST("/verify", paymentHandler.VerifyPayment)
			}
		}

		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(cfg.JWTSecret), middleware.AdminMiddleware())
		{
			admin.POST("/products", productHandler.CreateProduct)
			admin.PUT("/products/:id", productHandler.UpdateProduct)
			admin.DELETE("/products/:id", productHandler.DeleteProduct)
		}

		api.POST("/webhook/razorpay", paymentHandler.RazorpayWebhook)
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}