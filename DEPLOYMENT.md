# TRIPUND E-commerce Platform - Deployment Guide

## Backend Deployment to Google Cloud

### Prerequisites
1. Google Cloud CLI installed and configured
2. Google Cloud project created (ID: `tripund-ecommerce-1755860933`)
3. Billing account linked to the project

### Initial Setup (One-time)

1. **Enable Required APIs**:
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  containerregistry.googleapis.com \
  --project=tripund-ecommerce-1755860933
```

2. **Set up Firestore Database**:
```bash
gcloud firestore databases create \
  --location=asia-south1 \
  --type=firestore-native \
  --project=tripund-ecommerce-1755860933
```

3. **Create Service Account** (for local development):
```bash
gcloud iam service-accounts create tripund-backend \
  --display-name="TRIPUND Backend Service Account" \
  --project=tripund-ecommerce-1755860933

gcloud projects add-iam-policy-binding tripund-ecommerce-1755860933 \
  --member="serviceAccount:tripund-backend@tripund-ecommerce-1755860933.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

### Deployment Process

#### Option 1: Using the Deployment Script
```bash
cd backend-api
chmod +x deploy.sh
./deploy.sh
```

#### Option 2: Manual Deployment

1. **Build and Push Docker Image**:
```bash
cd backend-api
gcloud builds submit \
  --tag asia-south1-docker.pkg.dev/tripund-ecommerce-1755860933/cloud-run-source-deploy/tripund-backend \
  --region=asia-south1 \
  --project=tripund-ecommerce-1755860933
```

2. **Deploy to Cloud Run**:
```bash
gcloud run deploy tripund-backend \
  --image asia-south1-docker.pkg.dev/tripund-ecommerce-1755860933/cloud-run-source-deploy/tripund-backend \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --max-instances 10 \
  --set-env-vars "GIN_MODE=release,FIREBASE_PROJECT_ID=tripund-ecommerce-1755860933" \
  --project=tripund-ecommerce-1755860933
```

#### Option 3: Direct Source Deployment
```bash
cd backend-api
gcloud run deploy tripund-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --project=tripund-ecommerce-1755860933
```

### Environment Variables

The following environment variables are configured in Cloud Run:
- `GIN_MODE`: Set to "release" for production
- `FIREBASE_PROJECT_ID`: The Google Cloud project ID
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `CORS_ORIGIN`: Allowed origin for CORS (https://tripundlifestyle.com)
- `STORAGE_BUCKET`: Google Cloud Storage bucket name

### Post-Deployment

1. **Get Service URL**:
```bash
gcloud run services describe tripund-backend \
  --region=asia-south1 \
  --format='value(status.url)' \
  --project=tripund-ecommerce-1755860933
```

2. **Update Frontend Configuration**:
Update the API URL in `web-frontend/src/config/api.ts` with the Cloud Run service URL.

3. **Test the API**:
```bash
curl https://tripund-backend-[hash]-el.a.run.app/api/health
```

### Troubleshooting

#### Build Failures
If the build fails, check:
1. Cloud Build permissions are correctly set
2. Artifact Registry repository exists
3. Docker file syntax is correct

#### Permission Issues
Grant necessary permissions:
```bash
# For Cloud Build to push images
gcloud projects add-iam-policy-binding tripund-ecommerce-1755860933 \
  --member="serviceAccount:665685012221@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.admin"

# For Artifact Registry
gcloud artifacts repositories add-iam-policy-binding cloud-run-source-deploy \
  --location=asia-south1 \
  --member="serviceAccount:665685012221@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer" \
  --project=tripund-ecommerce-1755860933
```

## Frontend Deployment

### Option 1: Deploy to Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd web-frontend
vercel
```

3. Set environment variables in Vercel dashboard:
- `VITE_API_URL`: Your Cloud Run backend URL

### Option 2: Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase:
```bash
cd web-frontend
firebase init hosting
```

3. Build and deploy:
```bash
npm run build
firebase deploy
```

### Option 3: Deploy to Google Cloud Storage (Static Site)

1. Build the frontend:
```bash
cd web-frontend
npm run build
```

2. Create a storage bucket:
```bash
gsutil mb -p tripund-ecommerce-1755860933 -l asia-south1 gs://tripund-frontend
```

3. Upload the build:
```bash
gsutil -m cp -r dist/* gs://tripund-frontend/
```

4. Make the bucket public:
```bash
gsutil iam ch allUsers:objectViewer gs://tripund-frontend
```

5. Configure as a website:
```bash
gsutil web set -m index.html -e 404.html gs://tripund-frontend
```

## Database Management

### Seed Initial Data
Create initial categories and sample products:
```bash
# Use the Firestore console or create a seed script
```

### Backup Firestore
```bash
gcloud firestore export gs://tripund-backups/$(date +%Y%m%d-%H%M%S) \
  --project=tripund-ecommerce-1755860933
```

### Restore Firestore
```bash
gcloud firestore import gs://tripund-backups/[BACKUP_PATH] \
  --project=tripund-ecommerce-1755860933
```

## Monitoring

### View Logs
```bash
gcloud run services logs read tripund-backend \
  --region=asia-south1 \
  --project=tripund-ecommerce-1755860933
```

### Check Service Status
```bash
gcloud run services describe tripund-backend \
  --region=asia-south1 \
  --project=tripund-ecommerce-1755860933
```

## Cost Optimization

1. **Set Budget Alerts**: Configure in Google Cloud Console
2. **Use Cloud Run Minimum Instances**: Set to 0 for development
3. **Configure Maximum Instances**: Prevent unexpected scaling
4. **Monitor Usage**: Check Cloud Console regularly

## Security Checklist

- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Configure proper CORS origins
- [ ] Enable Cloud Security Scanner
- [ ] Set up Cloud Armor for DDoS protection
- [ ] Configure SSL certificates
- [ ] Implement rate limiting
- [ ] Set up monitoring alerts
- [ ] Regular security updates

## Support

For issues or questions:
- Check Cloud Run logs for errors
- Review Firestore rules and indexes
- Ensure all environment variables are set correctly
- Verify API endpoints are accessible