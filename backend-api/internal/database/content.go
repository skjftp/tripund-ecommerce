package database

import (
	"context"
	"fmt"
	"tripund-api/internal/models"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// Content management methods for Firebase

// GetContentByType retrieves content by its type
func (f *Firebase) GetContentByType(contentType string) (*models.Content, error) {
	doc, err := f.Client.Collection("content").Doc(contentType).Get(f.Context)
	if err != nil {
		return nil, err
	}

	var content models.Content
	if err := doc.DataTo(&content); err != nil {
		return nil, err
	}
	content.ID = doc.Ref.ID
	
	return &content, nil
}

// UpdateContent updates or creates content
func (f *Firebase) UpdateContent(contentType string, content *models.Content) error {
	_, err := f.Client.Collection("content").Doc(contentType).Set(f.Context, content)
	return err
}

// GetAllContent retrieves all content documents
func (f *Firebase) GetAllContent() ([]models.Content, error) {
	contents := make([]models.Content, 0)
	
	iter := f.Client.Collection("content").Documents(f.Context)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		
		var content models.Content
		if err := doc.DataTo(&content); err != nil {
			continue
		}
		content.ID = doc.Ref.ID
		contents = append(contents, content)
	}
	
	return contents, nil
}

// FAQ management methods

// GetFAQs retrieves all active FAQs ordered by their order field
func (f *Firebase) GetFAQs() ([]models.FAQ, error) {
	faqs := make([]models.FAQ, 0)
	
	iter := f.Client.Collection("faqs").
		Where("active", "==", true).
		OrderBy("order", firestore.Asc).
		Documents(f.Context)
		
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		
		var faq models.FAQ
		if err := doc.DataTo(&faq); err != nil {
			continue
		}
		faq.ID = doc.Ref.ID
		faqs = append(faqs, faq)
	}
	
	return faqs, nil
}

// CreateFAQ creates a new FAQ
func (f *Firebase) CreateFAQ(faq *models.FAQ) (string, error) {
	ref, _, err := f.Client.Collection("faqs").Add(f.Context, faq)
	if err != nil {
		return "", err
	}
	return ref.ID, nil
}

// UpdateFAQ updates an existing FAQ
func (f *Firebase) UpdateFAQ(id string, faq *models.FAQ) error {
	_, err := f.Client.Collection("faqs").Doc(id).Set(f.Context, faq)
	return err
}

// DeleteFAQ deletes an FAQ
func (f *Firebase) DeleteFAQ(id string) error {
	_, err := f.Client.Collection("faqs").Doc(id).Delete(f.Context)
	return err
}

// InitializeDefaultContent creates default content if it doesn't exist
func (f *Firebase) InitializeDefaultContent() error {
	// Default About content
	aboutContent := models.AboutContent{
		Title:       "About TRIPUND Lifestyle",
		Subtitle:    "Celebrating Indian Craftsmanship",
		MainContent: "At TRIPUND, we bridge the gap between traditional Indian artisans and modern homes. Each piece in our collection tells a story of heritage, skill, and passion passed down through generations.",
		Mission:     "To preserve and promote traditional Indian handicrafts while empowering artisan communities.",
		Vision:      "To be the leading platform connecting Indian artisans with global markets.",
		Values:      []string{"Authenticity", "Sustainability", "Craftsmanship", "Fair Trade"},
		Stats: []models.Stat{
			{Number: "500+", Label: "Artisan Partners"},
			{Number: "15", Label: "Indian States"},
			{Number: "100%", Label: "Handcrafted"},
		},
		WhyChooseUs: []string{
			"Direct from artisan partnerships",
			"Authentic handcrafted products",
			"Supporting traditional crafts",
			"Quality assured products",
		},
	}

	about := models.Content{
		Type:      "about",
		Title:     "About Page",
		Content:   structToMap(aboutContent),
		Published: true,
	}

	if err := f.UpdateContent("about", &about); err != nil {
		return fmt.Errorf("failed to create about content: %v", err)
	}

	// Default Footer content
	footerContent := models.FooterContent{
		CompanyName:        "TRIPUND Lifestyle",
		CompanyDescription: "Premium Indian artisan marketplace specializing in handcrafted wall decor, spiritual art, and cultural artifacts.",
		Email:              "support@tripundlifestyle.com",
		Phone:              "+91 98765 43210",
		Address: models.Address{
			Street:  "123 Artisan Street",
			City:    "New Delhi",
			State:   "Delhi",
			Country: "India",
			Pincode: "110001",
		},
		SocialLinks: models.SocialLinks{
			Facebook:  "https://facebook.com/tripundlifestyle",
			Instagram: "https://instagram.com/tripundlifestyle",
			Twitter:   "https://twitter.com/tripundlifestyle",
		},
		CopyrightText: "© 2024 TRIPUND Lifestyle. All rights reserved.",
	}

	footer := models.Content{
		Type:      "footer",
		Title:     "Footer Content",
		Content:   structToMap(footerContent),
		Published: true,
	}

	if err := f.UpdateContent("footer", &footer); err != nil {
		return fmt.Errorf("failed to create footer content: %v", err)
	}

	// Default Contact content
	contactContent := models.ContactContent{
		Title:       "Get In Touch",
		Subtitle:    "We'd love to hear from you",
		Description: "Have questions about our products or want to know more about our artisan partners? Feel free to reach out!",
		Email:       "support@tripundlifestyle.com",
		Phone:       "+91 98765 43210",
		WhatsApp:    "+91 98765 43210",
		Address: models.Address{
			Street:  "123 Artisan Street",
			City:    "New Delhi",
			State:   "Delhi",
			Country: "India",
			Pincode: "110001",
		},
		BusinessHours: []string{
			"Monday - Friday: 9:00 AM - 6:00 PM",
			"Saturday: 10:00 AM - 4:00 PM",
			"Sunday: Closed",
		},
	}

	contact := models.Content{
		Type:      "contact",
		Title:     "Contact Page",
		Content:   structToMap(contactContent),
		Published: true,
	}

	if err := f.UpdateContent("contact", &contact); err != nil {
		return fmt.Errorf("failed to create contact content: %v", err)
	}

	// Create sample FAQs
	sampleFAQs := []models.FAQ{
		{
			Question: "What makes TRIPUND products unique?",
			Answer:   "All our products are handcrafted by skilled artisans from various parts of India, ensuring each piece is unique and carries the authentic touch of traditional craftsmanship.",
			Order:    1,
			Active:   true,
		},
		{
			Question: "Do you offer international shipping?",
			Answer:   "Yes, we ship worldwide. International shipping charges and delivery times vary by location. Please check our shipping policy for more details.",
			Order:    2,
			Active:   true,
		},
		{
			Question: "What is your return policy?",
			Answer:   "We offer a 30-day return policy for all products. Items must be unused and in their original packaging. Custom orders are non-refundable.",
			Order:    3,
			Active:   true,
		},
		{
			Question: "How do I care for handcrafted products?",
			Answer:   "Care instructions vary by product type. Each product comes with specific care guidelines. Generally, avoid direct sunlight and moisture for most handicrafts.",
			Order:    4,
			Active:   true,
		},
		{
			Question: "Can I request custom designs?",
			Answer:   "Yes, we accept custom orders for many of our product categories. Please contact us with your requirements and we'll connect you with the right artisan.",
			Order:    5,
			Active:   true,
		},
	}

	for _, faq := range sampleFAQs {
		if _, err := f.CreateFAQ(&faq); err != nil {
			return fmt.Errorf("failed to create FAQ: %v", err)
		}
	}

	return nil
}

// Helper function to convert struct to map
func structToMap(v interface{}) map[string]interface{} {
	// This is a simple implementation - in production you'd use reflection or a library
	// For now, we'll handle the conversion in the handlers
	return map[string]interface{}{
		"data": v,
	}
}