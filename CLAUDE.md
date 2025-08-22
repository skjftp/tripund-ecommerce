# TRIPUND E-Commerce Platform - AI Assistant Guide

## Project Overview
TRIPUND is a full-stack e-commerce platform for Indian handicrafts with three main components: Backend API (Go), Web Frontend (React), and Admin Panel (React).

## Quick Access URLs
- **Production Frontend**: https://tripundlifestyle.netlify.app
- **Production Admin**: https://tripundlifestyle-admin.netlify.app
- **Production API**: https://tripund-backend-665685012221.asia-south1.run.app
- **GitHub Repo**: https://github.com/skjftp/tripund-ecommerce

## Project Structure
```
tripund-ecommerce/
├── backend-api/        # Go backend with Gin framework
├── web-frontend/       # Customer-facing React app
└── admin-panel/        # Admin dashboard React app
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

### Protected Endpoints (Requires JWT)
- `GET /api/v1/profile` - Get user profile
- `PUT /api/v1/profile` - Update profile
- `POST /api/v1/payment/create-order` - Create payment order
- `POST /api/v1/payment/verify` - Verify payment

### Admin Endpoints (Requires Admin Role)
- `POST /api/v1/admin/products` - Create product
- `PUT /api/v1/admin/products/:id` - Update product
- `DELETE /api/v1/admin/products/:id` - Delete product

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
- `categories` - Product categories
- `payments` - Payment records

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

## Notes for AI Assistants
1. Always run `npm install` before running dev servers
2. Check `.env` files exist before running locally
3. Use `git status` before committing to verify changes
4. Test API endpoints with curl before assuming they work
5. Clear Netlify cache if builds show old content
6. Check Cloud Run IAM settings if getting 403 errors
7. Verify CORS configuration when adding new domains
8. Always use Node.js v20+ for builds
9. Use Tailwind CSS v3 (not v4) for compatibility
10. Run build commands locally to test before deploying

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

---
Last Updated: August 2025
Platform: TRIPUND E-Commerce
Version: 1.0.0