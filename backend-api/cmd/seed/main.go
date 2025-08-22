package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"
	"tripund-api/internal/models"
)

func main() {
	ctx := context.Background()
	projectID := "tripund-ecommerce-1755860933"

	// Create Firestore client using Application Default Credentials
	client, err := firestore.NewClient(ctx, projectID, option.WithScopes("https://www.googleapis.com/auth/cloud-platform"))
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
	defer client.Close()

	// Define TRIPUND categories
	categories := []models.Category{
		{
			SKU:         "TLSFL00001",
			Name:        "Festivals",
			Slug:        "festivals",
			Description: "Festive decorations and items",
			Image:       "https://storage.googleapis.com/tripund-product-images/categories/festivals.png",
			Order:       1,
			Children: []models.SubCategory{
				{Name: "Torans", ProductCount: 0},
				{Name: "Door Décor/Hanging", ProductCount: 0},
				{Name: "Garlands", ProductCount: 0},
				{Name: "Decorations", ProductCount: 0},
				{Name: "Rangoli", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			SKU:         "TLSWD00001",
			Name:        "Wall Décor",
			Slug:        "wall-decor",
			Description: "Wall decorations and hangings",
			Image:       "https://storage.googleapis.com/tripund-product-images/categories/wall-decor.png",
			Order:       2,
			Children: []models.SubCategory{
				{Name: "Wall Hangings", ProductCount: 0},
				{Name: "Paintings", ProductCount: 0},
				{Name: "Frames", ProductCount: 0},
				{Name: "Mirrors", ProductCount: 0},
				{Name: "Clocks", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			SKU:         "TLSLT00001",
			Name:        "Lighting",
			Slug:        "lighting",
			Description: "Decorative lighting solutions",
			Image:       "https://storage.googleapis.com/tripund-product-images/categories/lighting.png",
			Order:       3,
			Children: []models.SubCategory{
				{Name: "Candles", ProductCount: 0},
				{Name: "Diyas", ProductCount: 0},
				{Name: "Lanterns", ProductCount: 0},
				{Name: "Decorative Lights", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			SKU:         "TLSHA00001",
			Name:        "Home Accent",
			Slug:        "home-accent",
			Description: "Home decoration accents",
			Image:       "https://storage.googleapis.com/tripund-product-images/categories/home-accent.png",
			Order:       4,
			Children: []models.SubCategory{
				{Name: "Cushion Covers", ProductCount: 0},
				{Name: "Table Décor", ProductCount: 0},
				{Name: "Vases", ProductCount: 0},
				{Name: "Showpieces", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			SKU:         "TLSDC00001",
			Name:        "Divine Collections",
			Slug:        "divine-collections",
			Description: "Religious and spiritual items",
			Image:       "https://storage.googleapis.com/tripund-product-images/categories/divine-collections.png",
			Order:       5,
			Children: []models.SubCategory{
				{Name: "Idols", ProductCount: 0},
				{Name: "Pooja Items", ProductCount: 0},
				{Name: "Spiritual Décor", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			SKU:         "TLSSB00001",
			Name:        "Storage & Bags",
			Slug:        "storage-bags",
			Description: "Storage solutions and bags",
			Image:       "https://storage.googleapis.com/tripund-product-images/categories/storage-bags.png",
			Order:       6,
			Children: []models.SubCategory{
				{Name: "Storage Boxes", ProductCount: 0},
				{Name: "Bags", ProductCount: 0},
				{Name: "Organizers", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			SKU:         "TLSGF00001",
			Name:        "Gifting",
			Slug:        "gifting",
			Description: "Gift items and hampers",
			Image:       "https://storage.googleapis.com/tripund-product-images/categories/gifting.png",
			Order:       7,
			Children: []models.SubCategory{
				{Name: "Gift Sets", ProductCount: 0},
				{Name: "Hampers", ProductCount: 0},
				{Name: "Personalized Gifts", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	// Clear existing categories
	fmt.Println("Clearing existing categories...")
	existingDocs, err := client.Collection("categories").Documents(ctx).GetAll()
	if err != nil {
		log.Printf("Warning: Failed to fetch existing categories: %v", err)
	} else {
		for _, doc := range existingDocs {
			if _, err := doc.Ref.Delete(ctx); err != nil {
				log.Printf("Warning: Failed to delete document %s: %v", doc.Ref.ID, err)
			}
		}
		fmt.Printf("Deleted %d existing categories\n", len(existingDocs))
	}

	// Add new categories to Firestore
	fmt.Println("Adding TRIPUND categories to Firestore...")
	for _, category := range categories {
		docRef, _, err := client.Collection("categories").Add(ctx, category)
		if err != nil {
			log.Printf("Failed to add category %s: %v", category.Name, err)
			continue
		}
		fmt.Printf("✓ Added category: %s (ID: %s)\n", category.Name, docRef.ID)
	}

	// Verify categories were added
	fmt.Println("\nVerifying categories in Firestore...")
	docs, err := client.Collection("categories").OrderBy("order", firestore.Asc).Documents(ctx).GetAll()
	if err != nil {
		log.Fatalf("Failed to fetch categories: %v", err)
	}

	fmt.Printf("\nSuccessfully stored %d categories in Firestore:\n", len(docs))
	for _, doc := range docs {
		var cat models.Category
		if err := doc.DataTo(&cat); err == nil {
			fmt.Printf("  - %s (%s) with %d subcategories\n", cat.Name, cat.SKU, len(cat.Children))
		}
	}

	fmt.Println("\n✅ Categories successfully stored in Firestore!")
}