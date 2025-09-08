package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	GinMode               string
	FirebaseProjectID     string
	FirebaseCredentialsPath string
	RazorpayKeyID         string
	RazorpayKeySecret     string
	RazorpayWebhookSecret string
	JWTSecret             string
	CORSOrigin            string
	StorageBucket         string
	// WhatsApp Business API
	WhatsAppAccessToken   string
	WhatsAppBusinessID    string
	WhatsAppPhoneNumberID string
	WhatsAppWebhookSecret string
	// MSG91 SMS API (API key will be in environment variables)
	MSG91SenderID         string
	MSG91TemplateID       string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	return &Config{
		Port:                  getEnv("PORT", "8080"),
		GinMode:               getEnv("GIN_MODE", "debug"),
		FirebaseProjectID:     getEnv("FIREBASE_PROJECT_ID", ""),
		FirebaseCredentialsPath: getEnv("FIREBASE_CREDENTIALS_PATH", "./serviceAccount.json"),
		RazorpayKeyID:         getEnv("RAZORPAY_KEY_ID", ""),
		RazorpayKeySecret:     getEnv("RAZORPAY_KEY_SECRET", ""),
		RazorpayWebhookSecret: getEnv("RAZORPAY_WEBHOOK_SECRET", ""),
		JWTSecret:             getEnv("JWT_SECRET", "your-secret-key"),
		CORSOrigin:            getEnv("CORS_ORIGIN", "http://localhost:5173"),
		StorageBucket:         getEnv("STORAGE_BUCKET", ""),
		// WhatsApp Business API
		WhatsAppAccessToken:   getEnv("WHATSAPP_ACCESS_TOKEN", ""),
		WhatsAppBusinessID:    getEnv("WHATSAPP_BUSINESS_ID", "657280173978203"),
		WhatsAppPhoneNumberID: getEnv("WHATSAPP_PHONE_NUMBER_ID", ""),
		WhatsAppWebhookSecret: getEnv("WHATSAPP_WEBHOOK_SECRET", "tripund-wa-secret"),
		// MSG91 SMS API
		MSG91SenderID:         getEnv("MSG91_SENDER_ID", "TPNDLS"),
		MSG91TemplateID:       getEnv("MSG91_TEMPLATE_ID", "1007865434019534765"),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}