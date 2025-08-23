package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORSMiddleware(origin string) gin.HandlerFunc {
	config := cors.Config{
		AllowOrigins:     []string{
			origin, 
			"http://localhost:3000", 
			"http://localhost:5173",
			"http://localhost:5174",
			"https://tripundlifestyle.netlify.app",
			"https://tripundlifestyle-admin.netlify.app",
			"https://tripundlifestyle.com",
			"https://www.tripundlifestyle.com",
			"http://tripundlifestyle.com",
			"http://www.tripundlifestyle.com",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	return cors.New(config)
}