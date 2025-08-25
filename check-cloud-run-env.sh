#!/bin/bash

echo "Checking current Cloud Run environment variables..."
echo "=================================================="
echo ""

# Set your service details
SERVICE_NAME="tripund-backend"
REGION="asia-south1"

# Get current environment variables (names only, not values for security)
echo "Current environment variables in Cloud Run:"
echo "-------------------------------------------"
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format="value(spec.template.spec.containers[0].env[].name)" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "Error: Could not fetch service details. Please check:"
    echo "1. You're logged in: gcloud auth login"
    echo "2. Project is set: gcloud config set project tripund-ecommerce-1755860933"
    exit 1
fi

echo ""
echo "Service URL:"
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format="value(status.url)" 2>/dev/null

echo ""
echo "Last updated:"
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format="value(status.latestReadyRevisionName)" 2>/dev/null

echo ""
echo "=================================================="
echo "To update ONLY Razorpay keys, use:"
echo ""
echo "gcloud run services update $SERVICE_NAME \\"
echo "  --region=$REGION \\"
echo "  --update-env-vars \\"
echo "RAZORPAY_KEY_ID=\"your-new-key\",\\"
echo "RAZORPAY_KEY_SECRET=\"your-new-secret\",\\"
echo "RAZORPAY_WEBHOOK_SECRET=\"your-new-webhook\""
echo ""
echo "This will preserve all other environment variables."
echo "=================================================="