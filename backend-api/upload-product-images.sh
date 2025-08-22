#!/bin/bash

echo "🖼️ Uploading product images to GCS bucket..."

# Base path for category and product images
BASE_PATH="/Users/sumitjha/Dropbox/Mac/Documents/Projects/tripund-ecommerce/Category and Product Images"

# Function to upload images from a directory
upload_images() {
    local category_dir="$1"
    local category_name="$2"
    
    echo "📁 Processing category: $category_name"
    
    # Find all product directories
    find "$category_dir" -mindepth 1 -maxdepth 1 -type d | while read -r product_dir; do
        product_folder=$(basename "$product_dir")
        echo "  📦 Processing product: $product_folder"
        
        # Extract product SKU from folder name (everything before the first dash)
        product_sku=$(echo "$product_folder" | cut -d'-' -f1)
        
        # Upload all PNG and JPG images
        find "$product_dir" -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read -r image_file; do
            image_name=$(basename "$image_file")
            gcs_path="products/$product_sku/$image_name"
            
            echo "    🔄 Uploading: $image_name -> gs://tripund-product-images/$gcs_path"
            gsutil cp "$image_file" "gs://tripund-product-images/$gcs_path"
            
            if [ $? -eq 0 ]; then
                echo "    ✅ Uploaded: $image_name"
            else
                echo "    ❌ Failed: $image_name"
            fi
        done
    done
}

# Upload images from each category
upload_images "$BASE_PATH/Figurines" "Figurines"
upload_images "$BASE_PATH/Idols" "Idols"  
upload_images "$BASE_PATH/Paintings & Prints/Bold" "Paintings-Bold"
upload_images "$BASE_PATH/Paintings & Prints/Classical" "Paintings-Classical"
upload_images "$BASE_PATH/Toran" "Toran"
upload_images "$BASE_PATH/Wall Decor" "Wall-Decor"

echo "🎉 Product image upload complete!"