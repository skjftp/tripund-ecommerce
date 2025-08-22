#!/bin/bash

# TRIPUND Backend Deployment Script for Google Cloud Run

PROJECT_ID="tripund-ecommerce-1755860933"
SERVICE_NAME="tripund-backend"
REGION="asia-south1"
IMAGE_NAME="asia-south1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}"

echo "🚀 Deploying TRIPUND Backend to Google Cloud Run"
echo "================================================"

# Set the project
gcloud config set project ${PROJECT_ID}

# Build and push the Docker image
echo "📦 Building Docker image..."
gcloud builds submit \
  --tag ${IMAGE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID}

if [ $? -ne 0 ]; then
  echo "❌ Docker build failed. Please check the errors above."
  exit 1
fi

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --max-instances 10 \
  --set-env-vars "GIN_MODE=release" \
  --set-env-vars "FIREBASE_PROJECT_ID=tripund-ecommerce-1755860933" \
  --set-env-vars "JWT_SECRET=change-this-secret-key-in-production" \
  --set-env-vars "CORS_ORIGIN=https://tripundlifestyle.com" \
  --set-env-vars "STORAGE_BUCKET=${PROJECT_ID}.appspot.com" \
  --project=${PROJECT_ID}

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful!"
  SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
  echo "🌐 Service URL: ${SERVICE_URL}"
else
  echo "❌ Deployment failed. Please check the errors above."
  exit 1
fi