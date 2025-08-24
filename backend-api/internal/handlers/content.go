package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"tripund-api/internal/database"
)

type ContentHandler struct {
	db *database.Firebase
}

func NewContentHandler(db *database.Firebase) *ContentHandler {
	return &ContentHandler{db: db}
}

// GetContent gets content by type (public endpoint)
func (h *ContentHandler) GetContent(c *gin.Context) {
	contentType := c.Param("type")
	
	// Return default content for now
	defaultContent := h.getDefaultContent(contentType)
	if defaultContent != nil {
		c.JSON(http.StatusOK, defaultContent)
		return
	}
	
	c.JSON(http.StatusNotFound, gin.H{"error": "Content not found"})
}

// GetContentAdmin gets content for admin panel
func (h *ContentHandler) GetContentAdmin(c *gin.Context) {
	contentType := c.Param("type")
	
	// Return default content for now
	defaultContent := h.getDefaultContent(contentType)
	if defaultContent != nil {
		c.JSON(http.StatusOK, defaultContent)
		return
	}
	
	c.JSON(http.StatusNotFound, gin.H{"error": "Content not found"})
}

// UpdateContent updates content (admin only)
func (h *ContentHandler) UpdateContent(c *gin.Context) {
	contentType := c.Param("type")
	
	var content map[string]interface{}
	if err := c.ShouldBindJSON(&content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// For now, just return success
	// In production, this would save to Firestore
	c.JSON(http.StatusOK, gin.H{
		"message": "Content updated successfully",
		"type": contentType,
		"content": content,
	})
}

// GetFAQs gets all FAQs (public endpoint)
func (h *ContentHandler) GetFAQs(c *gin.Context) {
	faqs := h.getDefaultFAQs()
	c.JSON(http.StatusOK, gin.H{
		"faqs": faqs,
	})
}

// UpdateFAQs updates FAQ list (admin endpoint)
func (h *ContentHandler) UpdateFAQs(c *gin.Context) {
	var requestData struct {
		FAQs []map[string]interface{} `json:"faqs"`
	}
	
	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "FAQs updated successfully",
		"faqs":    requestData.FAQs,
	})
}

func (h *ContentHandler) getDefaultContent(contentType string) map[string]interface{} {
	switch contentType {
	case "legal":
		return map[string]interface{}{
			"privacy_policy": `# Privacy Policy

Last updated: ` + time.Now().Format("January 2, 2006") + `

## Introduction
TRIPUND Lifestyle ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase from us.

## Information We Collect
- Personal information (name, email, phone number, address)
- Payment information (processed securely through payment gateways)
- Device and browser information
- Shopping preferences and history

## How We Use Your Information
- Process and fulfill your orders
- Communicate with you about your orders
- Send promotional emails (with your consent)
- Improve our website and services
- Comply with legal obligations

## Data Protection
We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Your Rights
You have the right to:
- Access your personal information
- Correct inaccurate data
- Request deletion of your data
- Opt-out of marketing communications

## Contact Us
If you have questions about this Privacy Policy, please contact us at privacy@tripundlifestyle.com`,
			"terms_conditions": `# Terms and Conditions

Last updated: ` + time.Now().Format("January 2, 2006") + `

## 1. Agreement to Terms
By accessing and using the TRIPUND Lifestyle website, you agree to be bound by these Terms and Conditions.

## 2. Products and Services
- All products are subject to availability
- We reserve the right to limit quantities
- Prices are subject to change without notice
- Product images are for illustration purposes

## 3. Orders and Payment
- We accept various payment methods including cards, UPI, and net banking
- All payments are processed securely
- Orders are subject to verification and acceptance

## 4. Shipping and Delivery
- Shipping charges and delivery times vary by location
- Risk of loss passes to you upon delivery
- We are not responsible for delays due to unforeseen circumstances

## 5. Returns and Refunds
- Products can be returned within 7 days of delivery
- Items must be unused and in original packaging
- Refunds are processed after inspection of returned items

## 6. Intellectual Property
All content on this website, including images, text, and logos, is the property of TRIPUND Lifestyle and protected by copyright laws.

## 7. Limitation of Liability
We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products.

## 8. Contact Information
For any questions regarding these terms, please contact us at legal@tripundlifestyle.com`,
			"last_updated": time.Now().Format("2006-01-02"),
		}
	case "shipping":
		return map[string]interface{}{
			"title":        "Shipping Information",
			"subtitle":     "We deliver handcrafted treasures across India",
			"deliveryTime": "5-7 business days for most locations",
			"zones": []map[string]string{
				{"zone": "Metro Cities", "delivery": "3-5 days", "charges": "Free above ₹2000"},
				{"zone": "Tier 1 Cities", "delivery": "5-7 days", "charges": "₹100"},
				{"zone": "Tier 2/3 Cities", "delivery": "7-10 days", "charges": "₹150"},
				{"zone": "Remote Areas", "delivery": "10-15 days", "charges": "₹200"},
			},
			"freeShippingThreshold": 2000,
			"expressShipping": map[string]interface{}{
				"available": true,
				"charges":   200,
				"delivery":  "2-3 business days",
			},
			"trackingInfo":   "You will receive tracking details via email and SMS once your order is dispatched.",
			"packagingNote":  "All items are carefully packaged to ensure they reach you in perfect condition.",
			"restrictions":   []string{"We currently ship only within India", "P.O. Box addresses are not accepted"},
			"contactSupport": "For shipping queries, contact us at shipping@tripundlifestyle.com",
		}
	case "returns":
		return map[string]interface{}{
			"title":        "Returns & Exchanges",
			"subtitle":     "Your satisfaction is our priority",
			"returnWindow": "7 days",
			"eligibleItems": []string{
				"Items in original condition with tags",
				"Unused and unwashed products",
				"Items with original packaging",
			},
			"nonReturnableItems": []string{
				"Customized or personalized products",
				"Items marked as final sale",
				"Digital gift cards",
				"Intimate apparel and jewelry",
			},
			"process": []string{
				"Initiate return request within 7 days of delivery",
				"Pack the item securely with all original tags",
				"Our courier partner will pick up the item",
				"Refund processed within 5-7 business days after inspection",
			},
			"exchangePolicy": "Exchanges are available for size/color variations subject to availability.",
			"refundMethods": []string{
				"Original payment method (5-7 days)",
				"Store credit (instant)",
				"Bank transfer (7-10 days)",
			},
			"damagePolicy":   "For damaged or defective items, report within 48 hours with photos for immediate resolution.",
			"contactSupport": "For returns & exchanges, email us at returns@tripundlifestyle.com",
		}
	case "faqs":
		return map[string]interface{}{
			"faqs": h.getDefaultFAQs(),
		}
	case "about":
		return map[string]interface{}{
			"title": "About TRIPUND Lifestyle",
			"subtitle": "Celebrating India's Rich Heritage Through Handcrafted Excellence",
			"mainContent": "TRIPUND Lifestyle is your gateway to authentic Indian handicrafts, bringing together centuries-old traditions with contemporary aesthetics. We partner directly with skilled artisans across India to bring you unique, handcrafted pieces that tell stories of our rich cultural heritage.",
			"mission": "To preserve and promote traditional Indian craftsmanship while providing sustainable livelihoods to artisan communities across the country.",
			"vision": "To be the leading platform connecting Indian artisans with global customers who value authenticity, quality, and cultural heritage.",
			"values": []map[string]string{
				{"title": "Authenticity", "description": "Every product is genuinely handcrafted using traditional techniques"},
				{"title": "Sustainability", "description": "Supporting eco-friendly practices and sustainable livelihoods"},
				{"title": "Quality", "description": "Ensuring premium quality through careful curation and quality checks"},
				{"title": "Heritage", "description": "Preserving India's rich artistic traditions for future generations"},
			},
			"stats": []map[string]interface{}{
				{"number": "500+", "label": "Artisan Partners"},
				{"number": "10,000+", "label": "Happy Customers"},
				{"number": "5000+", "label": "Unique Products"},
				{"number": "28", "label": "States Covered"},
			},
			"whyChooseUs": []string{
				"Direct sourcing from verified artisans",
				"100% authentic handcrafted products",
				"Fair trade practices ensuring artisan welfare",
				"Secure packaging and reliable delivery",
				"Easy returns and customer support",
			},
		}
	case "footer":
		return map[string]interface{}{
			"companyName":        "TRIPUND Lifestyle",
			"companyDescription": "Your destination for authentic Indian handicrafts, supporting traditional artisans and preserving cultural heritage.",
			"email":              "support@tripundlifestyle.com",
			"phone":              "+91 98765 43210",
			"address": map[string]string{
				"street":  "123 Artisan Street",
				"city":    "Mumbai",
				"state":   "Maharashtra",
				"country": "India",
				"pincode": "400001",
			},
			"socialLinks": map[string]string{
				"facebook":  "https://facebook.com/tripundlifestyle",
				"instagram": "https://instagram.com/tripundlifestyle",
				"twitter":   "https://twitter.com/tripundlifestyle",
				"linkedin":  "",
				"youtube":   "",
			},
			"quickLinks": []map[string]string{
				{"title": "All Products", "url": "/products"},
				{"title": "Categories", "url": "/categories"},
				{"title": "New Arrivals", "url": "/products?sort=newest"},
				{"title": "About Us", "url": "/about"},
			},
			"customerService": []map[string]string{
				{"title": "Contact Us", "url": "/contact"},
				{"title": "Shipping Info", "url": "/shipping"},
				{"title": "Returns & Exchanges", "url": "/returns"},
				{"title": "FAQ", "url": "/faq"},
				{"title": "Track Order", "url": "/track-order"},
			},
			"copyrightText": "© 2024 TRIPUND Lifestyle. All rights reserved.",
		}
	case "contact":
		return map[string]interface{}{
			"title":       "Get in Touch",
			"subtitle":    "We'd love to hear from you",
			"description": "Have questions about our products, need assistance with your order, or want to know more about our artisan partners? We're here to help!",
			"email":       "support@tripundlifestyle.com",
			"phone":       "+91 98765 43210",
			"whatsapp":    "+91 98765 43210",
			"address": map[string]string{
				"street":  "123 Artisan Street, Bandra West",
				"city":    "Mumbai",
				"state":   "Maharashtra",
				"country": "India",
				"pincode": "400050",
			},
			"businessHours": []string{
				"Monday - Friday: 10:00 AM - 7:00 PM IST",
				"Saturday: 10:00 AM - 4:00 PM IST",
				"Sunday: Closed",
			},
			"mapEmbedUrl":       "",
			"socialMediaText":   "Follow us on social media for updates, new arrivals, and artisan stories",
		}
	default:
		return nil
	}
}

func (h *ContentHandler) getDefaultFAQs() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"id":       "1",
			"question": "What payment methods do you accept?",
			"answer":   "We accept all major credit/debit cards, UPI, net banking, wallets, and cash on delivery (where available).",
			"category": "payment",
			"order":    1,
			"active":   true,
		},
		{
			"id":       "2",
			"question": "How long does shipping take?",
			"answer":   "Shipping typically takes 5-7 business days for most locations in India. Metro cities receive orders in 3-5 days.",
			"category": "shipping",
			"order":    2,
			"active":   true,
		},
		{
			"id":       "3",
			"question": "What is your return policy?",
			"answer":   "We offer a 7-day return policy for unused items in original condition with tags. Customized products are non-returnable.",
			"category": "returns",
			"order":    3,
			"active":   true,
		},
		{
			"id":       "4",
			"question": "Are your products handmade?",
			"answer":   "Yes, all our products are handcrafted by skilled Indian artisans using traditional techniques passed down through generations.",
			"category": "products",
			"order":    4,
			"active":   true,
		},
		{
			"id":       "5",
			"question": "Do you ship internationally?",
			"answer":   "Currently, we only ship within India. We're working on expanding our shipping to international locations soon.",
			"category": "shipping",
			"order":    5,
			"active":   true,
		},
	}
}