#!/bin/bash

# Batch upload product images to Google Cloud Storage

BUCKET="gs://tripund-product-images"
BASE_PATH="/Users/sumitjha/Dropbox/Mac/Documents/Projects/tripund-ecommerce/Category and Product Images"

echo "Starting batch upload of product images..."

# Function to upload and rename images
upload_product() {
    local SKU=$1
    local SOURCE_PATH=$2
    
    echo "Processing $SKU..."
    
    # Create the destination folder
    gsutil -q stat "$BUCKET/products/$SKU/" 2>/dev/null || echo "Creating folder for $SKU"
    
    # Upload PNG files
    for file in "$SOURCE_PATH"/*.png; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            # Rename files to standard format
            if [[ "$filename" == "$SKU.png" ]]; then
                dest_name="$SKU.png"
            elif [[ "$filename" == "$SKU "*.png ]]; then
                # Extract number from filename like "TLSPNT0003 (2).png"
                num=$(echo "$filename" | grep -o '([0-9])' | tr -d '()')
                dest_name="$SKU-$num.png"
            else
                # Clean up filename
                dest_name=$(echo "$filename" | sed "s/ /-/g" | sed "s/(//g" | sed "s/)//g")
            fi
            
            echo "  Uploading $filename as $dest_name"
            gsutil -q cp "$file" "$BUCKET/products/$SKU/$dest_name"
        fi
    done
    
    # Upload JPG files
    for file in "$SOURCE_PATH"/*.jpg; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            # Rename files to standard format
            if [[ "$filename" == "$SKU.jpg" ]]; then
                dest_name="$SKU.jpg"
            elif [[ "$filename" == "$SKU "*.jpg ]]; then
                # Extract number from filename
                num=$(echo "$filename" | grep -o '([0-9])' | tr -d '()')
                dest_name="$SKU-$num.jpg"
            else
                # Clean up filename
                dest_name=$(echo "$filename" | sed "s/ /-/g" | sed "s/(//g" | sed "s/)//g")
            fi
            
            echo "  Uploading $filename as $dest_name"
            gsutil -q cp "$file" "$BUCKET/products/$SKU/$dest_name"
        fi
    done
}

# Upload all products

# Figurines
upload_product "TLSHAF00001" "$BASE_PATH/Figurines/TLSHAF00001-Pink Budha-Polyresin"
upload_product "TLSHAF00002" "$BASE_PATH/Figurines/TLSHAF00002-Celadon GreenBudha-Polyresin -"
upload_product "TLSMG0007" "$BASE_PATH/Figurines/TLSMG0007-Subh aarambh-white silver"
upload_product "TLSMG0009" "$BASE_PATH/Figurines/TLSMG0007-Subh aarambh-white silver - Copy"
upload_product "TLSMG0013" "$BASE_PATH/Figurines/TLSMG0013-24KT beige kamdhenu"
upload_product "TLSRN00001" "$BASE_PATH/Figurines/TLSRN00001-wooly calm trays"
upload_product "TLSRN00002" "$BASE_PATH/Figurines/TLSRN00002-white cow"
upload_product "TLSWD00001" "$BASE_PATH/Figurines/TLSWD00001 -decanter"
upload_product "TLSWD00003" "$BASE_PATH/Figurines/TLSWD00003-Prosperity laughing buddha mask (1)"
upload_product "TLSWD00004" "$BASE_PATH/Figurines/TLSWD00004 janger Grace dancer mask"
upload_product "TLSWD00006" "$BASE_PATH/Figurines/TLSWD00006-dancing girl"
upload_product "TLSWD00007" "$BASE_PATH/Figurines/TLSWD00007-lotus radiance wood"
upload_product "TLSWD00009" "$BASE_PATH/Figurines/TLSWD00009-Hand-Carved Cedar Wood Equestrian Horse"

# Idols
upload_product "TLSDV00001" "$BASE_PATH/Idols/TLSDV00001-Divine Shiva Brass Idol"
upload_product "TLSMG0001" "$BASE_PATH/Idols/TLSMG0001_SIdhivinayak white temple"
upload_product "TLSMG0002" "$BASE_PATH/Idols/TLSMG0002-Sidhivinayak black temple"
upload_product "TLSMG0003" "$BASE_PATH/Idols/TLSMG0003-Sidhivinayak black temple"
upload_product "TLSMG0010" "$BASE_PATH/Idols/TLSMG0010-ganpti with shivlinga"
upload_product "TLSMT00008" "$BASE_PATH/Idols/TLSMT00008-ram bakhat-hanuman"
upload_product "TLSMT00015" "$BASE_PATH/Idols/TLSMT00015-Ladoo Gopal"
upload_product "TLSMT00023" "$BASE_PATH/Idols/TLSMT00023- Brass- Ganpati"
upload_product "TLSMT00027" "$BASE_PATH/Idols/TLSMT00027- brass radha krishna"
upload_product "TLSMT00029" "$BASE_PATH/Idols/TLSMT00029-divine balance-vishnu ji"
upload_product "TLSMT00033" "$BASE_PATH/Idols/TLSMT00033-Makhan Chor"

# Paintings - Classical
upload_product "TLSPNT0001" "$BASE_PATH/Paintings & Prints/Classical/TLSPNT0001-B&W Madhubala oil painting"
upload_product "TLSPNT0002" "$BASE_PATH/Paintings & Prints/Classical/TLSPNT0002-B&W Nargis oil painting"
upload_product "TLSPNT0006" "$BASE_PATH/Paintings & Prints/Classical/TLSPNT0006- Banaras Ghat Watercolor Painting"
upload_product "TLSPNT0007" "$BASE_PATH/Paintings & Prints/Classical/TLSPNT0007-madhubani"
upload_product "TLSPNT0008" "$BASE_PATH/Paintings & Prints/Classical/TLSPNT0008-City of Soul – Framed Urban Watercolor Painting  Vintage Indian Market Scene"
upload_product "TLSPNT0009" "$BASE_PATH/Paintings & Prints/Classical/TLSPNT0009-Echoes of Devotion\" – Abstract Temple Art in Monochrome Hues"

# Paintings - Bold
upload_product "TLSPNT0003" "$BASE_PATH/Paintings & Prints/Bold/TLSPNT0003-B&W Abstract oil painting"
upload_product "TLSPNT0004" "$BASE_PATH/Paintings & Prints/Bold/TLSPNT0004-B&W& red jazz musicoil painting"
upload_product "TLSPNT0005" "$BASE_PATH/Paintings & Prints/Bold/TLSPNT0005-speed in motion-6 horses"

# Torans
upload_product "TLSFL00001" "$BASE_PATH/Toran/TLSFL00001-Peacock & evil eye"
upload_product "TLSFL00002" "$BASE_PATH/Toran/TLSFL00002-Orange and Pearl with gold hanging (1)"
upload_product "TLSFL00003" "$BASE_PATH/Toran/TLSFL00003-Rose+Pearl+hanging"

# Wall Decor
upload_product "TLSMT00001" "$BASE_PATH/Wall Decor/TLSMT00001-daisy-flower1"
upload_product "TLSMT00002" "$BASE_PATH/Wall Decor/TLSMT00002 -owl guardian"
upload_product "TLSMT00003" "$BASE_PATH/Wall Decor/TLSMT00003-moonwatcher (1)"
upload_product "TLSWD00002" "$BASE_PATH/Wall Decor/TLSWD00002-wall crucifix"
upload_product "TLSWD00008" "$BASE_PATH/Wall Decor/TLSWD00008-Hamsa"

echo "Upload complete! All images are available at:"
echo "https://storage.googleapis.com/tripund-product-images/products/[SKU]/[filename]"