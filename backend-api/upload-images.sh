#!/bin/bash

# Category Images Selection and Upload Script
BUCKET="gs://tripund-product-images"
IMAGE_DIR="/Users/sumitjha/Dropbox/Mac/Documents/Projects/tripund-ecommerce/Category and Product Images"

echo "Uploading category and product images to Google Cloud Storage..."

# Wall Decor Category Image
echo "Uploading Wall Decor category image..."
gsutil cp "$IMAGE_DIR/Wall Decor/TLSMT00001-daisy-flower1/TLSMT00001-daisy-flower1.png" "$BUCKET/categories/wall-decor.png"

# Festivals Category Image (Toran)
echo "Uploading Festivals category image..."
gsutil cp "$IMAGE_DIR/Toran/TLSFL00001-Peacock & evil eye/TLSFL00001-Peacock & evil eye.png" "$BUCKET/categories/festivals.png"

# Divine Collections Category Image (Idols)
echo "Uploading Divine Collections category image..."
gsutil cp "$IMAGE_DIR/Idols/TLSDV00001-Divine Shiva Brass Idol/TLSDV00001- Divine Shiva Brass Idol (1).png" "$BUCKET/categories/divine-collections.png"

# Home Accent Category Image (Figurines)
echo "Uploading Home Accent category image..."
gsutil cp "$IMAGE_DIR/Figurines/TLSHAF00001-Pink Budha-Polyresin/TLSHAF00001-Coral Pink BUDHA (1).png" "$BUCKET/categories/home-accent.png"

# Paintings Category Image
echo "Uploading Paintings category image..."
gsutil cp "$IMAGE_DIR/Paintings & Prints/Classical/TLSPNT0001-B&W Madhubala oil painting/TLSPNT0001 (1).png" "$BUCKET/categories/paintings.png"

# Upload all product images
echo "Uploading all product images..."

# Wall Decor products
gsutil -m cp -r "$IMAGE_DIR/Wall Decor/"*.png "$BUCKET/products/wall-decor/"

# Toran products (Festivals)
gsutil -m cp -r "$IMAGE_DIR/Toran/"*.png "$BUCKET/products/festivals/"

# Idols products (Divine Collections)
gsutil -m cp -r "$IMAGE_DIR/Idols/"*.png "$BUCKET/products/divine-collections/"

# Figurines products (Home Accent)
gsutil -m cp -r "$IMAGE_DIR/Figurines/"*.png "$BUCKET/products/home-accent/"

# Paintings products
gsutil -m cp -r "$IMAGE_DIR/Paintings & Prints/"*.png "$BUCKET/products/paintings/"

echo "Making images publicly accessible..."
gsutil iam ch allUsers:objectViewer "$BUCKET"

echo "Upload complete!"
echo "Category images available at: https://storage.googleapis.com/tripund-product-images/categories/"
echo "Product images available at: https://storage.googleapis.com/tripund-product-images/products/"