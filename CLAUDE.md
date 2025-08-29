# TRIPUND E-Commerce Platform - AI Assistant Guide

## Project Overview
TRIPUND is a full-stack e-commerce platform for Indian handicrafts with three main components: Backend API (Go), Web Frontend (React), and Admin Panel (React). The platform uses Firebase/Firestore for data persistence and Google Cloud Run for backend hosting.

**IMPORTANT**: Never run or test anything on localhost. All development should be done directly in code and deployed to production environments.

## Quick Access URLs
- **Production Frontend**: https://tripundlifestyle.netlify.app
- **Production Admin**: https://tripundlifestyle-admin.netlify.app
- **Production API**: https://tripund-backend-665685012221.asia-south1.run.app (alias: https://tripund-backend-rafqv5m7ga-el.a.run.app - both URLs point to the same service)
- **GitHub Repo**: https://github.com/skjftp/tripund-ecommerce
- **Firestore Console**: https://console.cloud.google.com/firestore/databases/-default-/data/panel?project=tripund-ecommerce-1755860933
- **Firebase Console**: https://console.firebase.google.com/project/tripund-ecommerce-1755860933/overview

## Project Structure
```
tripund-ecommerce/
├── backend-api/        # Go backend with Gin framework
├── web-frontend/       # Customer-facing React app
├── admin-panel/        # Admin dashboard React app
└── tripund_mobile/     # Flutter mobile app for Android/iOS
```

## Important Commands

### Backend Development
```bash
cd backend-api

# Run locally
go run cmd/server/main.go

# Deploy to Google Cloud Run
./deploy.sh

# Build Docker image
docker build -t tripund-backend .

# Test API endpoints
curl https://tripund-backend-665685012221.asia-south1.run.app/api/v1/health
```

### Frontend Development
```bash
cd web-frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Check TypeScript
npm run typecheck
```

### Admin Panel Development
```bash
cd admin-panel

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Flutter Mobile App Development
```bash
cd tripund_mobile

# Get dependencies
flutter pub get

# Run on connected device
flutter run

# Build debug APK
flutter build apk --debug

# Build release APK
flutter build apk --release

# Install on connected device
adb install -r build/app/outputs/flutter-apk/app-release.apk

# Monitor logs
adb logcat -s flutter
```

## Authentication Credentials

### Admin Panel
- Email: `admin@tripund.com`
- Password: `admin123`

### Test User (Frontend)
- Register new account or use test credentials if available

## Environment Variables

### Backend (.env)
```
PORT=8080
GIN_MODE=debug
FIREBASE_PROJECT_ID=tripund-ecommerce-1755860933
JWT_SECRET=your-secret-key
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
CORS_ORIGIN=http://localhost:3000
EMAIL_FROM=orders@tripundlifestyle.com
EMAIL_FROM_NAME=TRIPUND Lifestyle
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8080/api/v1
VITE_RAZORPAY_KEY_ID=your-razorpay-key
```

### Admin Panel (.env)
```
VITE_API_URL=https://tripund-backend-665685012221.asia-south1.run.app/api/v1
```

## API Endpoints

### Public Endpoints
- `GET /api/v1/health` - Health check
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/admin/auth/login` - Admin login
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:id` - Get product details
- `GET /api/v1/categories` - List all categories (returns from Firestore)
- `GET /api/v1/categories/:id` - Get specific category

### Protected Endpoints (Requires JWT)
- `GET /api/v1/profile` - Get user profile
- `PUT /api/v1/profile` - Update profile
- `POST /api/v1/payment/create-order` - Create payment order
- `POST /api/v1/payment/verify` - Verify payment

### Admin Endpoints (Requires Admin Role)
- `POST /api/v1/admin/products` - Create product
- `PUT /api/v1/admin/products/:id` - Update product
- `DELETE /api/v1/admin/products/:id` - Delete product
- `POST /api/v1/admin/categories` - Create category
- `PUT /api/v1/admin/categories/:id` - Update category
- `DELETE /api/v1/admin/categories/:id` - Delete category
- `POST /api/v1/admin/categories/initialize` - Initialize default TRIPUND categories

## Deployment

### Deploy Backend to Cloud Run
```bash
cd backend-api
gcloud run deploy tripund-backend \
  --source . \
  --region=asia-south1 \
  --allow-unauthenticated \
  --port=8080
```

### Deploy Frontend to Netlify
Frontend and admin panel auto-deploy on push to main branch.

Manual deploy:
```bash
# Frontend
cd web-frontend
npm run build
netlify deploy --dir=dist --prod

# Admin Panel
cd admin-panel
npm run build
netlify deploy --dir=dist --prod
```

## Common Issues & Solutions

### CORS Errors
- Check that the requesting domain is in `backend-api/internal/middleware/cors.go`
- Ensure Cloud Run service allows unauthenticated access

### TypeScript Errors
- Disable strict checks in `tsconfig.app.json`:
  ```json
  "verbatimModuleSyntax": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false
  ```

### Netlify Build Failures
- Check Node version in `netlify.toml` (should be 20+)
- Clear build cache in Netlify dashboard
- Ensure Tailwind CSS version compatibility (use v3, not v4)

### Cloud Run Access Issues
- Remove organization policy restrictions:
  ```bash
  gcloud resource-manager org-policies delete \
    constraints/iam.allowedPolicyMemberDomains \
    --project=PROJECT_ID
  ```
- Add public access:
  ```bash
  gcloud run services add-iam-policy-binding SERVICE_NAME \
    --region=asia-south1 \
    --member="allUsers" \
    --role="roles/run.invoker"
  ```

## Database Structure (Firestore)

### Collections
- `users` - User accounts and profiles
- `products` - Product catalog
- `orders` - Customer orders
- `categories` - Product categories (7 main TRIPUND categories with subcategories)
- `payments` - Payment records

### Firestore Setup

#### Enable Firestore in GCP Project
```bash
# Enable required Firebase APIs
gcloud services enable firebase.googleapis.com
gcloud services enable firebasehosting.googleapis.com
gcloud services enable firestore.googleapis.com

# Add Firebase to existing GCP project
curl -X POST \
  https://firebase.googleapis.com/v1beta1/projects/tripund-ecommerce-1755860933:addFirebase \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json"
```

#### Configure Application Default Credentials
```bash
# Login to GCP
gcloud auth login
gcloud config set project tripund-ecommerce-1755860933

# Set application default credentials
gcloud auth application-default login
```

### Category Management

#### Seed Categories to Firestore
```bash
# Using Node.js script
cd backend-api
npm install
node seed-categories.js

# Using Go seed command
cd backend-api
go run cmd/seed/main.go
```

#### Initialize Categories via API
```bash
# Admin endpoint to initialize default TRIPUND categories
curl -X POST https://tripund-backend-665685012221.asia-south1.run.app/api/v1/admin/categories/initialize \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

#### TRIPUND Category Structure
1. **Festivals** (TLSFL00001) - Torans, Door Décor, Garlands, Decorations, Rangoli
2. **Wall Décor** (TLSWD00001) - Wall Hangings, Paintings, Frames, Mirrors, Clocks
3. **Lighting** (TLSLT00001) - Candles, Diyas, Lanterns, Decorative Lights
4. **Home Accent** (TLSHA00001) - Cushion Covers, Table Décor, Vases, Showpieces
5. **Divine Collections** (TLSDC00001) - Idols, Pooja Items, Spiritual Décor
6. **Storage & Bags** (TLSSB00001) - Storage Boxes, Bags, Organizers
7. **Gifting** (TLSGF00001) - Gift Sets, Hampers, Personalized Gifts

## Testing

### Test Backend API
```bash
# Health check
curl https://tripund-backend-665685012221.asia-south1.run.app/api/v1/health

# Admin login
curl -X POST https://tripund-backend-665685012221.asia-south1.run.app/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tripund.com","password":"admin123"}'
```

### Test Frontend
1. Open https://tripundlifestyle.netlify.app
2. Browse products
3. Add to cart
4. Proceed to checkout

### Test Admin Panel
1. Open https://tripundlifestyle-admin.netlify.app
2. Login with admin credentials
3. Check dashboard
4. Manage products/orders

## Git Workflow

```bash
# Check status
git status

# Add all changes
git add -A

# Commit with descriptive message
git commit -m "feat: Add new feature description"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

## Monitoring

### Check Deployment Status
- **Cloud Run**: https://console.cloud.google.com/run
- **Netlify Frontend**: https://app.netlify.com/sites/tripundlifestyle
- **Netlify Admin**: https://app.netlify.com/sites/tripundlifestyle-admin

### View Logs
- **Backend Logs**: `gcloud run logs read --service=tripund-backend --region=asia-south1`
- **Build Logs**: Check Cloud Build history in GCP Console
- **Frontend Logs**: Check browser console and Netlify deploy logs

## Performance Optimization

### Frontend
- Lazy load components
- Optimize images (use WebP format)
- Enable caching headers
- Use CDN for static assets

### Backend
- Implement caching (Redis)
- Optimize database queries
- Use connection pooling
- Enable gzip compression

## Email System Setup

### SendGrid Configuration
The platform uses SendGrid for reliable, scalable email delivery of automated notifications.

#### Setup Steps:
1. **SendGrid Account Setup**:
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Complete email verification
   - Choose appropriate plan (Free tier: 100 emails/day)

2. **Create API Key**:
   - Go to Settings → API Keys in SendGrid dashboard
   - Create new API key with "Mail Send" full access permissions
   - Copy the API key securely

3. **Sender Authentication**:
   - **Single Sender**: Verify `orders@tripundlifestyle.com` in SendGrid
   - **Domain Authentication**: Set up DNS records for `tripundlifestyle.com` domain

4. **Deploy with SendGrid Config**:
   ```bash
   gcloud run services update tripund-backend \
     --set-env-vars EMAIL_FROM=orders@tripundlifestyle.com \
     --set-env-vars EMAIL_FROM_NAME="TRIPUND Lifestyle" \
     --set-env-vars SENDGRID_API_KEY=your-sendgrid-api-key \
     --region=asia-south1
   ```

### Email Templates
- **Order Confirmation**: Professional HTML template with order details, variant info, pricing
- **Shipping Confirmation**: Tracking info, delivery timeline, shipped items
- **Responsive Design**: Mobile-friendly templates with TRIPUND branding
- **Variant Support**: Shows color/size information for products with variants

### Email Flow
1. **Order Created** → Automatic order confirmation email sent
2. **Order Status → "Shipped"** → Automatic shipping confirmation email sent
3. **Asynchronous Processing**: Emails sent in background, don't block order processing
4. **Error Handling**: Failed email sends are logged but don't affect order processing

### Monitoring
Check Cloud Run logs for email status:
- Success: `"Order confirmation email sent successfully for order XXX"`
- Failure: `"Failed to send order confirmation email for order XXX: [error]"`

## Security Checklist
- [ ] JWT tokens expire after 24 hours
- [ ] Passwords hashed with bcrypt
- [ ] CORS restricted to specific domains
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using Firestore)
- [ ] XSS protection headers enabled
- [ ] HTTPS enforced on all services
- [ ] Environment variables for secrets

## Contact & Support
- **Repository**: https://github.com/skjftp/tripund-ecommerce
- **Issues**: Report at GitHub Issues
- **Cloud Project**: tripund-ecommerce-1755860933

## Image CDN Configuration

### Cloud CDN Setup
- **CDN IP Address**: 34.149.173.174
- **CDN Domain**: images.tripundlifestyle.com
- **SSL Certificate**: tripund-images-ssl (managed)
- **Backend Bucket**: tripund-images-backend
- **GCS Bucket**: tripund-product-images

### DNS Configuration
Add this A record to your DNS provider:
- **Type**: A
- **Name**: images
- **Value**: 34.149.173.174
- **TTL**: 300

### Image URLs
- **Category Images**: https://images.tripundlifestyle.com/categories/[image-name].png
- **Product Images**: https://images.tripundlifestyle.com/products/[image-name].jpg

### CDN Benefits
- Images served via Google Cloud CDN for faster loading
- Global edge caching
- Automatic HTTPS with managed SSL certificates
- No need for public GCS bucket access

## Recent Development Work Completed

### Flutter Mobile App Fixes (August 27, 2025)
1. **Cart Persistence Implementation**:
   - Added SharedPreferences to CartProvider for automatic cart saving/loading
   - Cart items now persist between app sessions
   - Automatic save on add/remove/update operations

2. **Authentication & API Token Management**:
   - Fixed auth token not being sent in API requests
   - Added `_ensureAuthToken()` method to check token before each API call
   - Proper token synchronization between AuthProvider and ApiService singleton
   - Token now properly set on login and loaded on app startup

3. **Dynamic Payment Settings**:
   - Integrated backend `/api/v1/settings/public` endpoint
   - COD (Cash on Delivery) option dynamically shown based on backend settings
   - COD limit validation implemented
   - Default to online payment when COD is disabled

4. **Order Creation & Payment Flow Fixes**:
   - **Critical Fix**: Backend returns HTTP 201 (Created) for orders, not 200
   - Fixed field mappings: `product_id` (with underscore), `firstName`/`lastName` at root level
   - Proper error handling and detailed logging throughout checkout flow
   - GPS location integration for address with Geolocator package
   - State-based GST calculation (CGST/SGST for UP, IGST for other states)

5. **Checkout Screen Enhancements**:
   - Complete rewrite of checkout_screen_v2.dart with proper state management
   - Saved addresses integration - auto-populate from address book
   - State dropdown with all Indian states
   - GPS location button for automatic address filling
   - Razorpay integration working with proper order and payment order creation

### UI/UX Improvements (August 2025)
1. **Navigation System Overhaul**:
   - Replaced static navigation with dynamic category dropdowns
   - Categories fetched from database and displayed with subcategories on hover
   - Mobile burger menu shows expandable category sections
   - Removed duplicate search bars - single search icon approach
   - Dedicated search page at `/search` with popular searches

2. **Product Card Alignment Fixes**:
   - Fixed inconsistent card heights due to varying image sizes
   - Implemented fixed aspect-square containers for images
   - Added min-height to titles and descriptions for uniformity
   - Used flexbox with flex-grow for proper vertical alignment
   - "Add to Cart" buttons now align at bottom consistently

3. **Admin Panel Enhancements**:
   - Added image upload functionality with drag-and-drop
   - Created reusable `ImageUpload.tsx` component
   - Replaced URL inputs with file upload for products and categories
   - Added subcategory selection in product form
   - Fixed 404 errors on product update/delete endpoints
   - Proper authorization headers for admin API calls

4. **Mobile Experience**:
   - Animated hamburger menu with smooth transitions
   - Search icon in header (desktop and mobile)
   - Category-focused browsing on mobile
   - Removed redundant search options
   - Better touch targets and spacing

### Product Management System (August 2025)
1. **Cloud CDN Implementation**:
   - Set up Google Cloud CDN for image serving (IP: 34.149.173.174)
   - Created backend bucket: `tripund-images-backend`
   - Configured SSL certificate for `images.tripundlifestyle.com`
   - Updated all image URLs to use CDN instead of direct GCS access

2. **Product Data Creation**:
   - Created 40+ products from document analysis
   - Uploaded 100+ product images to GCS bucket
   - Organized images by SKU in `/products/{SKU}/` structure
   - Created `upload-product-images.sh` script for batch processing

3. **Document Parsing System**:
   - Implemented `parse-product-descriptions.js` with mammoth library
   - Successfully parsed 41 product documents extracting:
     - Features, materials, specifications, dimensions
     - Care instructions, origin, artisan stories
   - Updated all products in Firestore with rich metadata

4. **Backend Updates**:
   - Completely restructured Go Product model to flat structure
   - Updated product handlers for array-contains category filtering
   - Fixed API endpoints to return proper product data

5. **Frontend Components**:
   - Created `ImageCarousel.tsx` with thumbnail navigation
   - Updated `ProductCard.tsx` for multi-image display
   - Implemented proper fallback image handling

6. **Admin Panel Enhancements**:
   - Complete rewrite of Products page with real API integration
   - Created comprehensive `ProductForm.tsx` component for CRUD operations
   - Added full validation and error handling
   - Integrated form with Products page for complete workflow
   - Features: Multi-image URLs, dynamic attributes, category selection, tags

### Product Categories Created
- **Divine Collections**: 23 products (idols, spiritual items)
- **Wall Décor**: 14 products (paintings, wall hangings)
- **Festivals**: 3 products (torans, decorations)

### Scripts Created
- `seed-categories.js` - Initialize TRIPUND categories
- `create-products.js` - Generate products from folders
- `parse-product-descriptions.js` - Extract data from .docx files
- `upload-product-images.sh` - Batch upload images to GCS
- `test-products.js` - Test Firestore product queries

## Notes for AI Assistants
1. **NEVER run or test anything on localhost - work directly in code**
2. **NEVER implement temporary workarounds - always fix the root issue properly**
3. **IMPORTANT: Both https://tripund-backend-665685012221.asia-south1.run.app and https://tripund-backend-rafqv5m7ga-el.a.run.app are aliases for the same Cloud Run service - DO NOT change between them**
4. Check `.env` files exist before deployment
5. Use `git status` before committing to verify changes
6. Test API endpoints with curl after deployment
7. Clear Netlify cache if builds show old content
8. Check Cloud Run IAM settings if getting 403 errors
9. Verify CORS configuration when adding new domains
10. Always use Node.js v20+ for builds
11. Use Tailwind CSS v3 (not v4) for compatibility
12. Deploy directly to production for testing
13. **Backend returns HTTP 201 for successful order creation, not 200**
14. **Always build debug APKs when troubleshooting mobile app issues**
15. **Cart persistence uses SharedPreferences with key 'cart_items'**
16. **Auth token must be synchronized between AuthProvider and ApiService**
17. **Payment settings (COD enabled/limit) fetched from /api/v1/settings/public**
18. **iOS deployment requires Firebase 3.x+ and gRPC 1.69+ for Xcode 15+ compatibility**
19. **iOS pods deployment target must be 13.0+ minimum - forced in Podfile post_install**
20. **iOS release builds: use `flutter build ios --release` then `xcrun devicectl device install app`**
21. **Flutter update service only runs on Android - Platform.isAndroid check prevents iOS issues**

## Quick Fixes

### If admin panel won't login:
1. Check backend is running: `curl https://tripund-backend-665685012221.asia-south1.run.app/api/v1/health`
2. Verify CORS allows admin URL
3. Check browser console for specific errors
4. Try incognito mode to bypass cache

### If frontend shows API errors:
1. Check backend URL in .env
2. Verify CORS configuration
3. Check network tab for actual error
4. Test endpoint with curl

### If deployment fails:
1. Check build logs for specific error
2. Verify all dependencies are installed
3. Check environment variables are set
4. Clear cache and retry

## Key Features

### Frontend (Customer-facing)
- Dynamic category navigation with subcategories
- Product search with dedicated search page
- Image carousel for multiple product images
- Wishlist functionality
- Shopping cart with session persistence
- User authentication (register/login)
- Responsive design for mobile/desktop
- Category filtering on products page
- Proper case formatting for product names

### Mobile App (Flutter)
- **Orders Screen**: Complete revamp with carousel for multiple products
  - Fixed 75x75px image size consistency
  - Product details display (name, color, size, quantity, price)
  - Clean status badges with proper colors
  - Gradient header design
- **Product Variants**: Full variant system implementation
  - Variant selection modal with cheapest default
  - Color/size combinations with dynamic pricing
  - Variant info displayed throughout cart/checkout/orders
- **Payment System**:
  - Proper payment flow (order → payment order → verification)
  - Payment modals for success/failed/cancelled states
  - Online Payment and COD options only
  - Dynamic COD limits from backend
  - Live Razorpay integration
- **Category Filters**:
  - Fixed category filtering using IDs not names
  - Subcategory filters in category product listings
  - Category search integration
- **Data Persistence**:
  - Cart persistence with SharedPreferences
  - Address persistence in database
  - Auth token synchronization
- **iOS Deployment (August 29, 2025)**:
  - **Successfully resolved Firebase/gRPC compatibility issues** with Xcode 15+
  - **Updated Firebase dependencies**: firebase_core ^3.15.2, cloud_firestore ^5.6.12
  - **Fixed deployment targets**: All pods forced to iOS 13.0+ minimum
  - **Platform-specific updates**: Android update modal now iOS-excluded
  - **App icon updated**: Generated from new_app_icon.jpg for all iOS sizes
  - **Release build deployed**: 54.6MB production build installed on iPhone 16 Pro Max
  - **Xcode configuration**: Proper signing with team DKJP8LND7B, bundle ID com.tripundlifestyle.tripundMobile
  - **Build commands verified**: `flutter build ios --release` and `xcrun devicectl device install app`

### Admin Panel
- Product CRUD operations with multi-image support
- Category management with subcategories
- Image upload with drag-and-drop
- Dynamic form validation
- Real-time product search and filtering
- Dashboard with analytics
- Order management
- Inventory tracking
- Bulk operations support

### Backend API
- RESTful API with Go/Gin framework
- JWT authentication
- Role-based access control (Admin/User)
- Firestore integration
- Dynamic category system
- Product filtering and search
- Payment integration ready (Razorpay)
- CORS configuration for multiple domains
- **SendGrid email notifications system**:
  - Order confirmation emails (HTML templates)
  - Shipping confirmation emails with tracking
  - SendGrid API integration for reliable delivery
  - Variant-aware email content (color/size info)
  - Asynchronous sending to avoid blocking
  - Scalable transactional email delivery

## Component Library

### Reusable Components
- `ImageUpload.tsx` - Drag-and-drop file upload with preview
- `ImageCarousel.tsx` - Multi-image carousel with navigation
- `ProductCard.tsx` - Consistent product display card
- `ProductGrid.tsx` - Responsive product grid layout
- `CategoryForm.tsx` - Category creation/editing form
- `ProductForm.tsx` - Comprehensive product management form

---
Last Updated: August 29, 2025
Platform: TRIPUND E-Commerce
Version: 1.0.22
iOS Build: Successfully deployed to iPhone 16 Pro Max