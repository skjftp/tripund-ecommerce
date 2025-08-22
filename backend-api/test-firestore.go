package main

import (
	"context"
	"fmt"
	"log"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"
)

func main() {
	ctx := context.Background()
	projectID := "tripund-ecommerce-1755860933"

	// Create Firestore client with Application Default Credentials
	client, err := firestore.NewClient(ctx, projectID, option.WithScopes("https://www.googleapis.com/auth/cloud-platform"))
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
	defer client.Close()

	// Test connection by listing collections
	collections := client.Collections(ctx)
	colCount := 0
	for {
		col, err := collections.Next()
		if err != nil {
			break
		}
		fmt.Printf("Found collection: %s\n", col.ID)
		colCount++
	}

	if colCount == 0 {
		fmt.Println("No collections found. Creating test collection...")
		
		// Create a test document in categories collection
		_, err = client.Collection("categories").Doc("test").Set(ctx, map[string]interface{}{
			"name": "Test Category",
			"sku":  "TEST001",
		})
		if err != nil {
			log.Printf("Failed to create test document: %v", err)
		} else {
			fmt.Println("Test document created successfully!")
		}
	}

	fmt.Println("Firestore connection successful!")
}