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
  --set-env-vars "WHATSAPP_BUSINESS_ID=1836026090679932,WHATSAPP_PHONE_NUMBER_ID=849480508241215,WHATSAPP_ACCESS_TOKEN=[PRODUCTION_WHATSAPP_ACCESS_TOKEN],WHATSAPP_WEBHOOK_SECRET=tripund-wa-secret,APP_BUILD_NUMBER=22,APP_DOWNLOAD_URL=https://github.com/skjftp/tripund-ecommerce/releases/download/v1.0.21/tripund-v1.0.21.apk,APP_VERSION=1.0.21,CORS_ORIGIN=https://tripundlifestyle.com,EMAIL_FROM=orders@tripundlifestyle.com,EMAIL_FROM_NAME=TRIPUND Lifestyle,FIREBASE_PROJECT_ID=tripund-ecommerce-1755860933,GIN_MODE=release,JWT_SECRET=Tripund678!!,RAZORPAY_KEY_ID=rzp_live_R9Uuc0X01ekIdc,RAZORPAY_KEY_SECRET=p9UF9sNieQuU8GnkM1cYTuNA,RAZORPAY_WEBHOOK_SECRET=webhook-tripund-678!!,SENDGRID_API_KEY=[PRODUCTION_SENDGRID_API_KEY],STORAGE_BUCKET=tripund-ecommerce-1755860933.appspot.com" \
  --project=${PROJECT_ID}

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful!"
  SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
  echo "🌐 Service URL: ${SERVICE_URL}"
else
  echo "❌ Deployment failed. Please check the errors above."
  exit 1
fi