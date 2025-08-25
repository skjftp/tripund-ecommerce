#!/bin/bash

# Get admin token
echo "Getting admin token..."
TOKEN=$(curl -s -X POST https://tripund-backend-665685012221.asia-south1.run.app/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tripund.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token obtained: ${TOKEN:0:20}..."

# Update category with landscape image URL
echo "Updating Divine Collections category with landscape image..."
curl -X PUT https://tripund-backend-665685012221.asia-south1.run.app/api/v1/admin/categories/XdMdptha70B4ZettYEK8 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "landscape_image": "https://images.tripundlifestyle.com/categories/divine-collections-landscape.png"
  }'

echo ""
echo "Category updated successfully!"