package database

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
	"tripund-api/internal/config"
	"tripund-api/internal/models"
)

type Firebase struct {
	Client  *firestore.Client
	Storage *storage.Client
	Context context.Context
}

func NewFirebase(cfg *config.Config) (*Firebase, error) {
	ctx := context.Background()

	var opt option.ClientOption
	
	// Check if we're running on Google Cloud (Cloud Run)
	if os.Getenv("K_SERVICE") != "" {
		// Running on Cloud Run - use default credentials
		log.Println("Running on Cloud Run - using default credentials")
		opt = option.WithScopes("https://www.googleapis.com/auth/cloud-platform")
	} else if cfg.FirebaseCredentialsPath != "" && fileExists(cfg.FirebaseCredentialsPath) {
		// Local development - use service account file
		log.Println("Using service account file:", cfg.FirebaseCredentialsPath)
		opt = option.WithCredentialsFile(cfg.FirebaseCredentialsPath)
	} else {
		// Use Application Default Credentials
		log.Println("Using Application Default Credentials")
		opt = option.WithScopes("https://www.googleapis.com/auth/cloud-platform")
	}

	app, err := firebase.NewApp(ctx, &firebase.Config{
		ProjectID: cfg.FirebaseProjectID,
	}, opt)
	if err != nil {
		return nil, err
	}

	client, err := app.Firestore(ctx)
	if err != nil {
		return nil, err
	}

	storageClient, err := storage.NewClient(ctx, opt)
	if err != nil {
		return nil, err
	}

	log.Println("Firebase initialized successfully")

	return &Firebase{
		Client:  client,
		Storage: storageClient,
		Context: ctx,
	}, nil
}

func (f *Firebase) Close() {
	if f.Client != nil {
		f.Client.Close()
	}
	if f.Storage != nil {
		f.Storage.Close()
	}
}

func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

// GetClient returns the Firestore client (for compatibility with existing code)
func (f *Firebase) GetClient() interface{} {
	return f
}

// GetProductByID retrieves a product by its ID from Firestore
func (f *Firebase) GetProductByID(productID string) (*models.Product, error) {
	doc, err := f.Client.Collection("products").Doc(productID).Get(f.Context)
	if err != nil {
		return nil, err
	}

	var product models.Product
	if err := doc.DataTo(&product); err != nil {
		return nil, err
	}
	product.ID = doc.Ref.ID

	return &product, nil
}