# Manual Content Initialization Instructions

Since the backend deployment is having issues, you can manually initialize the content in Firebase Console.

## Option 1: Use Firebase Console UI

1. Go to: https://console.firebase.google.com/project/tripund-ecommerce-1755860933/firestore/data
2. Create the following collections and documents:

### Collection: `content`

#### Document ID: `about`
```json
{
  "type": "about",
  "title": "About Page",
  "content": {
    "data": {
      "title": "About TRIPUND Lifestyle",
      "subtitle": "Celebrating Indian Craftsmanship",
      "mainContent": "At TRIPUND, we bridge the gap between traditional Indian artisans and modern homes. Each piece in our collection tells a story of heritage, skill, and passion passed down through generations.",
      "mission": "To preserve and promote traditional Indian handicrafts while empowering artisan communities.",
      "vision": "To be the leading platform connecting Indian artisans with global markets.",
      "values": ["Authenticity", "Sustainability", "Craftsmanship", "Fair Trade"],
      "stats": [
        { "number": "500+", "label": "Artisan Partners" },
        { "number": "15", "label": "Indian States" },
        { "number": "100%", "label": "Handcrafted" }
      ]
    }
  },
  "published": true,
  "last_updated": "2024-08-23T00:00:00Z"
}
```

#### Document ID: `footer`
```json
{
  "type": "footer",
  "title": "Footer Content",
  "content": {
    "data": {
      "companyName": "TRIPUND Lifestyle",
      "companyDescription": "Premium Indian artisan marketplace specializing in handcrafted wall decor, spiritual art, and cultural artifacts.",
      "email": "support@tripundlifestyle.com",
      "phone": "+91 98765 43210",
      "address": {
        "street": "123 Artisan Street",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "pincode": "110001"
      },
      "socialLinks": {
        "facebook": "https://facebook.com/tripundlifestyle",
        "instagram": "https://instagram.com/tripundlifestyle",
        "twitter": "https://twitter.com/tripundlifestyle"
      },
      "copyrightText": "© 2024 TRIPUND Lifestyle. All rights reserved."
    }
  },
  "published": true,
  "last_updated": "2024-08-23T00:00:00Z"
}
```

#### Document ID: `contact`
```json
{
  "type": "contact",
  "title": "Contact Page",
  "content": {
    "data": {
      "title": "Get In Touch",
      "subtitle": "We'd love to hear from you",
      "description": "Have questions about our products or want to know more about our artisan partners? Feel free to reach out!",
      "email": "support@tripundlifestyle.com",
      "phone": "+91 98765 43210",
      "whatsapp": "+91 98765 43210",
      "address": {
        "street": "123 Artisan Street",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "pincode": "110001"
      },
      "businessHours": [
        "Monday - Friday: 9:00 AM - 6:00 PM",
        "Saturday: 10:00 AM - 4:00 PM",
        "Sunday: Closed"
      ]
    }
  },
  "published": true,
  "last_updated": "2024-08-23T00:00:00Z"
}
```

### Collection: `faqs`

Create documents with auto-generated IDs for each FAQ:

#### FAQ 1
```json
{
  "question": "What makes TRIPUND products unique?",
  "answer": "All our products are handcrafted by skilled artisans from various parts of India, ensuring each piece is unique and carries the authentic touch of traditional craftsmanship.",
  "order": 1,
  "active": true,
  "created": "2024-08-23T00:00:00Z",
  "updated": "2024-08-23T00:00:00Z"
}
```

#### FAQ 2
```json
{
  "question": "Do you offer international shipping?",
  "answer": "Yes, we ship worldwide. International shipping charges and delivery times vary by location. Please check our shipping policy for more details.",
  "order": 2,
  "active": true,
  "created": "2024-08-23T00:00:00Z",
  "updated": "2024-08-23T00:00:00Z"
}
```

#### FAQ 3
```json
{
  "question": "What is your return policy?",
  "answer": "We offer a 30-day return policy for all products. Items must be unused and in their original packaging. Custom orders are non-refundable.",
  "order": 3,
  "active": true,
  "created": "2024-08-23T00:00:00Z",
  "updated": "2024-08-23T00:00:00Z"
}
```

#### FAQ 4
```json
{
  "question": "How do I care for handcrafted products?",
  "answer": "Care instructions vary by product type. Each product comes with specific care guidelines. Generally, avoid direct sunlight and moisture for most handicrafts.",
  "order": 4,
  "active": true,
  "created": "2024-08-23T00:00:00Z",
  "updated": "2024-08-23T00:00:00Z"
}
```

#### FAQ 5
```json
{
  "question": "Can I request custom designs?",
  "answer": "Yes, we accept custom orders for many of our product categories. Please contact us with your requirements and we'll connect you with the right artisan.",
  "order": 5,
  "active": true,
  "created": "2024-08-23T00:00:00Z",
  "updated": "2024-08-23T00:00:00Z"
}
```

## Option 2: Quick Deploy Fix

If you want to fix the backend deployment:

1. Remove the content management endpoints temporarily
2. Deploy the backend
3. Re-add the content management endpoints
4. Deploy again

The issue is likely with the Go module dependencies not being properly resolved for the new files.

## Current Status

- ✅ Frontend pages are ready to consume dynamic content
- ✅ Admin panel content management is ready
- ✅ Fallback to default content is working
- ⏳ Backend API endpoints need deployment
- ⏳ Initial content needs to be added to Firestore

Once you manually add the content to Firestore as described above, the website will start showing the dynamic content (though it will still show 404 errors in console until the backend is deployed).