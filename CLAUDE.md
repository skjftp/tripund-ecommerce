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

## 🚨 CRITICAL WARNING - NEVER OVERRIDE ENVIRONMENT VARIABLES ⚠️

**ABSOLUTE PROHIBITION**: Under NO circumstances should ANY deployment, update, or code change EVER:
1. **Override, modify, or remove production environment variables**
2. **Use `--set-env-vars` flag during deployments**
3. **Put real API keys, tokens, or secrets in ANY git files**
4. **Commit actual production credentials to version control**

**VIOLATION OF THESE RULES WILL BREAK THE LIVE PRODUCTION SYSTEM**

**CURRENT PRODUCTION ENVIRONMENT VARIABLES (AS OF SEPTEMBER 5, 2025):**
```
# WhatsApp Business API (September 2025)
WHATSAPP_BUSINESS_ID=1836026090679932
WHATSAPP_PHONE_NUMBER_ID=849480508241215
WHATSAPP_ACCESS_TOKEN=[PRODUCTION_WHATSAPP_ACCESS_TOKEN]
WHATSAPP_WEBHOOK_SECRET=tripund-wa-secret

# App Configuration
APP_BUILD_NUMBER=22
APP_DOWNLOAD_URL=https://github.com/skjftp/tripund-ecommerce/releases/download/v1.0.21/tripund-v1.0.21.apk
APP_VERSION=1.0.21

# Core Platform
CORS_ORIGIN=https://tripundlifestyle.com
EMAIL_FROM=orders@tripundlifestyle.com
EMAIL_FROM_NAME=TRIPUND Lifestyle
FIREBASE_PROJECT_ID=tripund-ecommerce-1755860933
GIN_MODE=release
JWT_SECRET=[PRODUCTION_JWT_SECRET]
STORAGE_BUCKET=tripund-ecommerce-1755860933.appspot.com

# Payment Integration
RAZORPAY_KEY_ID=[PRODUCTION_RAZORPAY_KEY_ID]
RAZORPAY_KEY_SECRET=[PRODUCTION_RAZORPAY_KEY_SECRET]
RAZORPAY_WEBHOOK_SECRET=[PRODUCTION_RAZORPAY_WEBHOOK_SECRET]

# Email Integration
SENDGRID_API_KEY=[PRODUCTION_SENDGRID_API_KEY]
```

**NOTE**: These are placeholder values for reference. ACTUAL production values are stored in Cloud Run and MUST NEVER be overwritten.

**DEPLOYMENT SAFETY RULES:**
1. **NEVER use `--set-env-vars` flag during deployments**
2. **NEVER put real API keys in git files**
3. **NEVER clear or reset environment variables**
4. **ALWAYS use deploy.sh which preserves existing environment variables**
5. **NEVER commit actual production credentials to version control**
6. **Use `gcloud run services describe tripund-backend --region=asia-south1` to view current values if needed**

**🚨 AI ASSISTANT RULES:**
- NEVER put real API keys in any files
- NEVER use --set-env-vars during deployments
- NEVER overwrite production environment variables
- ALWAYS use placeholder values like [PRODUCTION_KEY_NAME]

**SAFE DEPLOYMENT COMMAND:**
```bash
cd backend-api

# ONLY use this command - it preserves ALL existing environment variables
./deploy.sh
```

**FORBIDDEN COMMANDS:**
```bash
# NEVER use these commands:
gcloud run deploy --set-env-vars="..."  # This overwrites environment variables
gcloud run services update --set-env-vars="..."  # This overwrites environment variables
```

**EMERGENCY RECOVERY**: If environment variables are accidentally overwritten:
1. Immediately restore using the values listed above
2. Redeploy the service with correct variables
3. Test all functionality (payments, emails, authentication)

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

## Google OAuth Integration (Prepared)

### Current Status: PARKED
Google Sign-In infrastructure is prepared but not active:

#### Frontend Ready:
- GoogleSignInButton component created
- GoogleAuthService implemented
- Google Sign-In API script included in HTML
- Login/Register pages prepared (currently disabled)

#### Backend Ready:
- `/api/v1/auth/google` endpoint created
- JWT integration prepared
- User creation flow ready

#### To Activate:
1. Get Google OAuth Client ID from [Google Console](https://console.cloud.google.com)
2. Add to environment variables: `VITE_GOOGLE_CLIENT_ID`
3. Enable GoogleSignInButton in LoginPage and RegisterPage
4. Complete backend token verification logic

## Enhanced E-Commerce System

### Current Status: FULLY OPERATIONAL
Complete professional e-commerce platform with advanced features:

#### Automatic Invoice System (ACTIVE):
- **Auto-generation**: Invoice created on payment verification (not webhook)
- **12% GST**: Dynamic rate from settings API with reverse calculation for inclusive pricing  
- **GST Compliance**: Your GSTIN (09AALCT9072D1ZY) with proper CGST/SGST/IGST
- **Clean Format**: No payment/bank information sections, professional layout
- **Stock Integration**: Stock automatically decremented on successful payment
- **User Access**: Invoices accessible from orders page with View/Download buttons

#### Email Template System (ACTIVE):
- **Database Templates**: Both order confirmation and shipping use elegant designs
- **Order Confirmation**: TRIPUND branded template with 12% GST calculations
- **Shipping Confirmation**: Custom tracking URLs from admin, invoice access links
- **Template Management**: Admin can modify templates in Email Templates section
- **Smart Fallback**: Hardcoded template only if database template fails

#### Order Tracking System (ACTIVE):
- **Custom URLs**: Admin provides courier tracking URLs when marking as shipped
- **Smart Links**: Email links go to actual courier tracking pages
- **Professional Modal**: Tracking URL input when changing order status to shipped
- **Fallback**: Generic order page if no custom tracking URL provided

#### Stock Management (ACTIVE):
- **Featured Products**: 0 stock products completely hidden
- **Product Listings**: Out of stock badges with alert icons
- **Variant Logic**: Show product if ANY size/color is available
- **Real-time Updates**: Stock decremented immediately on payment success

#### Authentication & UX (ACTIVE):
- **Login Flow**: Professional login modal with returnTo redirect for invoice access
- **Mobile Responsive**: Complete mobile optimization for profile and checkout
- **Payment Modals**: Success/failed/cancelled modals like mobile app
- **Clean Navigation**: Removed duplicate pages, unified structure

#### Admin Workflow:
1. **Order Received** → Auto-invoice generated + stock decremented + email sent
2. **Mark as Shipped** → Tracking URL modal → Custom courier tracking in email
3. **Settings Management**: GST configuration, email templates, all centralized

#### Customer Workflow:
1. **Payment Success** → Elegant confirmation email + invoice generated + stock decremented
2. **Shipping Selection** → Standard (free above ₹2000) or Express (₹200) options
3. **Order Shipped** → Shipping email with courier tracking + invoice link  
4. **Invoice Access** → Direct from orders page or email links
5. **Authentication**: Login modal with returnTo redirect if accessing invoice while logged out

#### Enhanced Admin Features (September 2025):
- **Customer Management**: Real customer names and profiles in orders
- **Order Details**: Complete order modal with all information
- **Tracking Integration**: Custom courier URL modal when marking as shipped
- **Image Management**: Team member photo uploads with drag-and-drop
- **Dynamic Categories**: All 10 categories from database in product form
- **Express Shipping**: Conditional display based on settings
- **Error Prevention**: Null safety checks preventing admin panel crashes

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

### 🚨 CRITICAL DEPLOYMENT SAFETY 🚨
**NEVER OVERRIDE ENVIRONMENT VARIABLES**: The backend service contains live production secrets including:
- Razorpay API keys for payment processing
- SendGrid API key for email delivery
- JWT secret for authentication
- Webhook secrets for security

**ANY deployment that overwrites these variables will BREAK the production system.**

### General Guidelines
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
22. **🚨 CRITICAL: NEVER overwrite production environment variables during deployments - they contain live API keys and secrets**
23. **Email templates**: Elegant order confirmation and shipping confirmation templates now set as defaults
24. **Email system**: SendGrid integration with order/shipping notifications using database templates
25. **Automatic invoices**: Generate GST-compliant invoices automatically on payment success with 12% GST
26. **Mobile responsive**: Profile page fully optimized for mobile with tab navigation  
27. **Category icons**: Fast-loading Lucide icons for category carousel with auto-scroll
28. **Google OAuth**: Infrastructure prepared but not activated (Client ID needed)
29. **Stock management**: Featured products filter 0 stock, out of stock badges on listings
30. **Email templates**: Both order confirmation and shipping use elegant database templates
31. **Custom tracking**: Admin-provided courier URLs in shipping confirmation emails
32. **Authentication flow**: Login modal with returnTo redirect for invoice access
33. **Clean navigation**: Removed duplicate pages, unified invoice access from orders page
34. **Express shipping**: Dynamic option in checkout when rate > 0 in settings
35. **Team member images**: Upload functionality for About Us section instead of URLs
36. **Admin panel stability**: Fixed null pointer crashes in notifications and security sections
37. **Customer identification**: Real names in admin orders instead of "Guest User"
38. **Dynamic categories**: Product form shows all 10 categories from database
23. **Current admin credentials: admin@tripund.com / password (change immediately after login)**
24. **RBAC system active: 5 roles, 23 permissions, permission-based UI controls implemented**

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
- **WhatsApp Business API integration**:
  - Complete Meta Graph API integration for messaging
  - Template management (create/fetch/update via Meta API)
  - Individual and bulk messaging with CSV support
  - Webhook integration for incoming messages and status updates
  - Automatic order confirmations via WhatsApp + Email
  - Automatic shipping notifications with tracking links
  - WhatsApp OTP system for authentication
  - Contact and campaign management
  - Admin panel WhatsApp section with full management UI
  - Real-time message history and delivery status tracking

## WhatsApp Business API System (September 2025)

### Current Status: FULLY OPERATIONAL
Complete WhatsApp Business integration with professional messaging capabilities:

#### ✅ WhatsApp Integration Features (ACTIVE):
- **Dual Notification System**: Orders and shipping sent via WhatsApp + Email
- **Template Management**: Create and manage Meta-approved message templates
- **Individual Messaging**: Send WhatsApp messages to specific customers
- **Bulk Campaigns**: CSV-based mass messaging with template parameters
- **Webhook Processing**: Real-time incoming message handling and status updates
- **Contact Management**: Automatic contact creation from customer interactions
- **OTP Authentication**: WhatsApp-based login and verification system
- **Admin Dashboard**: Complete WhatsApp management interface
- **Campaign Analytics**: Track message delivery, read receipts, and engagement

#### WhatsApp Account Details:
- **Business Account**: Tripund Lifestyle (VERIFIED)
- **Phone Number**: +91 97114 41830 (GREEN quality rating)
- **WABA ID**: 1836026090679932
- **Phone Number ID**: 849480508241215
- **Webhook URL**: https://tripund-backend-665685012221.asia-south1.run.app/api/v1/webhook/whatsapp
- **Webhook Status**: ACTIVE and receiving messages

#### Template Status:
- **hello_world**: APPROVED (for testing)
- **order_management_1**: APPROVED (for order confirmations)
- **tripund_order_confirmation**: PENDING REVISION
- **tripund_shipping_confirmation**: PENDING REVISION

#### Admin Workflow:
1. **Order Received** → Auto-confirmation via WhatsApp + Email + Invoice + Stock update
2. **Order Shipped** → WhatsApp shipping notification with tracking + Email
3. **Customer Replies** → Messages appear in admin WhatsApp dashboard
4. **Bulk Campaigns** → CSV upload for promotional messaging
5. **Template Management** → Create/manage templates via admin panel

#### Customer Experience:
1. **Order Placement** → Immediate WhatsApp confirmation with order details
2. **Shipping Update** → WhatsApp notification with tracking link
3. **Direct Communication** → Reply to WhatsApp messages for support
4. **OTP Authentication** → WhatsApp-based login verification option

## Component Library

### Reusable Components
- `ImageUpload.tsx` - Drag-and-drop file upload with preview
- `ImageCarousel.tsx` - Multi-image carousel with navigation
- `ProductCard.tsx` - Consistent product display card
- `ProductGrid.tsx` - Responsive product grid layout
- `CategoryForm.tsx` - Category creation/editing form
- `ProductForm.tsx` - Comprehensive product management form

---
Last Updated: September 9, 2025
Platform: TRIPUND E-Commerce - Complete Mobile-First Platform with Advanced Intelligence
Version: 1.1.0+ (Mobile-First + Intelligence)
Backend: Cloud Run revision 00181-67t with complete mobile authentication and stock intelligence
Frontend: Mobile-first authentication with universal login system
Admin Panel: Complete analytics, stock intelligence, and WhatsApp management
Mobile App: iOS app with mobile OTP authentication deployed
Authentication: 100% mobile-first with WhatsApp/SMS OTP delivery
Stock Intelligence: Demand tracking and customer request management
Payment System: Accurate customer stats and working payment retry flow
Address Management: GPS location-based with Indian state dropdown
Analytics: Instagram ad tracking and customer behavior insights

## Latest Major Enhancements (September 2025)

### 📱 Complete Mobile-First Authentication Revolution
**Universal Login System** - Single login/signup flow for all users across web and mobile platforms
- **WhatsApp-First OTP Delivery**: Promotional delivery choice popup encouraging WhatsApp usage
- **MSG91 SMS Integration**: Template-based SMS with TPNDLS sender ID (Template: 68beb383697d5313670dadac)
- **Mobile OTP Template**: WhatsApp 'otp' template with copy code button functionality
- **Indian Mobile Only**: Accepts only +91 numbers starting with 6-9 digits
- **iOS Mobile App**: Complete mobile OTP authentication system deployed and tested

### 🧠 Intelligent Stock Request & Demand Management
**Out-of-Stock Intelligence System** - Convert missed sales into business intelligence
- **Smart Product Buttons**: Orange 'Request when available' for out-of-stock vs green 'Add to Cart'
- **Customer Demand Capture**: Modal with quantity, variant, and preference collection
- **Admin Demand Dashboard**: Most requested products ranked by customer interest
- **Customer Contact Intelligence**: Phone, email, notes for direct customer outreach
- **Business Decision Support**: Data-driven restocking based on real customer demand

### 📊 Advanced Analytics & Business Intelligence
**Instagram Ad Performance Tracking** - Measure campaign ROI and optimize ad spend
- **UTM Parameter Tracking**: Complete Instagram campaign attribution system
- **Session Analytics**: 2-hour user sessions with device, location, and behavior tracking
- **Conversion Attribution**: Revenue tracking by traffic source (Instagram, direct, organic)
- **E-commerce Event Tracking**: Product views, cart additions, checkout starts, purchases
- **Admin Analytics Dashboard**: Instagram performance metrics with conversion rates and ROI

### 🏠 Location-Enhanced Address Management
**GPS-Powered Address System** - Professional address collection with location intelligence
- **GPS Auto-Population**: One-click address detection from current location
- **Indian State Management**: Complete dropdown with all 36 states and union territories
- **Clean Location Data**: Filtered geocoding to avoid irrelevant address information
- **Consistent UX**: Dedicated AddressesPage matching Orders/Wishlist navigation pattern
- **Authenticated-Only**: No guest checkout, mandatory mobile authentication for security

### 💳 Professional Payment & Customer Management
**Enhanced Payment Flow** - Professional payment handling with accurate business metrics
- **Payment Retry Functionality**: Try Again button properly reopens Razorpay payment modal
- **Accurate Customer Statistics**: Only count confirmed/paid orders in admin dashboard
- **No False Admin Notifications**: Notifications only sent for successful payment verification
- **Mobile-Optimized Forms**: Compact phone input with country code selection
- **Single Name Fields**: Simplified checkout forms for better user experience

### 🎨 User Experience Excellence
**Mobile-First Design Philosophy** - Optimized for Indian market preferences
- **Compact Login Design**: Removed excessive white space, beautiful gradient backgrounds
- **TRIPUND Logo Branding**: Consistent favicon across all platforms and browser tabs
- **Category Navigation**: Enhanced auto-scroll with manual scroll compatibility
- **Mobile-Responsive Components**: All UI elements optimized for mobile-first usage
- **Consistent Field Naming**: Unified approach to user data across all platforms

### 🔧 Technical Architecture Excellence
**Robust Foundation** - Enterprise-grade technical implementation
- **Frontend Pagination**: Simple, effective product browsing (20 items per page)
- **Mobile-Only Database**: Complete migration from email users to mobile_users collection
- **Environment Variable Protection**: Secure deployment with credential protection
- **Deploy Script Enhancement**: Automatic traffic routing with environment preservation
- **Cross-Platform Consistency**: Same authentication and data structure across web/mobile

## Core Platform Capabilities (Updated September 2025)

### 🌐 **Multi-Platform Mobile-First Ecosystem**
- **Web Platform**: Universal mobile authentication with WhatsApp-first OTP
- **iOS Mobile App**: Native mobile authentication matching web experience
- **Admin Dashboard**: Complete business intelligence and management tools  
- **Backend APIs**: Universal mobile authentication supporting all platforms consistently

### 📱 **Advanced Mobile Authentication Stack**
- **Universal Flow**: Auto-detects new vs returning users, no separate signup
- **Dual OTP Delivery**: WhatsApp (recommended) with SMS fallback via MSG91
- **Indian Market Focus**: +91 mobile numbers only, optimized for Indian users
- **Professional UX**: WhatsApp promotion with green theme and 'Best' badges
- **Cross-Platform**: Same authentication experience on web and mobile apps

### 🎯 **Business Intelligence & Analytics**
- **Stock Demand Intelligence**: Customer request tracking for out-of-stock products
- **Instagram Campaign Analytics**: UTM tracking with conversion and ROI measurement
- **Customer Behavior Analytics**: Session tracking, device analysis, geographic insights
- **WhatsApp Communication Intelligence**: Conversation management and message analytics
- **Revenue Attribution**: Accurate tracking of paid orders and customer lifetime value

### 🔐 **Enterprise-Grade Security & Compliance**
- **Mobile-First Security**: Secure OTP delivery via WhatsApp and SMS templates
- **Authenticated-Only Commerce**: Mandatory authentication for all purchase transactions
- **Environment Security**: Protected deployment scripts and credential management systems
- **Payment Security**: Only authenticated mobile users can complete purchases
- **Data Protection**: Clean mobile user data structure with proper field validation