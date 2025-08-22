#!/bin/bash

# Upload all product images to Google Cloud Storage
BUCKET="gs://tripund-product-images"
LOCAL_PATH="/Users/sumitjha/Dropbox/Mac/Documents/Projects/tripund-ecommerce/Category and Product Images"

echo "Starting upload of all product images to GCS..."

# Upload Figurines
echo "Uploading Figurines..."
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSHAF00001-Pink Budha-Polyresin/"*.png "$BUCKET/products/TLSHAF00001/"
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSHAF00001-Pink Budha-Polyresin/"*.jpg "$BUCKET/products/TLSHAF00001/"

gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSHAF00002-Celadon GreenBudha-Polyresin -/"*.png "$BUCKET/products/TLSHAF00002/"
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSHAF00002-Celadon GreenBudha-Polyresin -/"*.jpg "$BUCKET/products/TLSHAF00002/"

gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSMG0007-Subh aarambh-white silver/"*.png "$BUCKET/products/TLSMG0007/"
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSMG0007-Subh aarambh-white silver Copy/"*.png "$BUCKET/products/TLSMG0009/"
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSMG0013-24KT beige kamdhenu/"*.png "$BUCKET/products/TLSMG0013/"

gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSRN00001-wooly calm trays/"*.png "$BUCKET/products/TLSRN00001/"
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSRN00001-wooly calm trays/"*.jpg "$BUCKET/products/TLSRN00001/"

gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSRN00002-white cow/"*.jpg "$BUCKET/products/TLSRN00002/"

gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSWD00001 -decanter/"*.png "$BUCKET/products/TLSWD00001/"
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSWD00003-Prosperity laughing buddha mask (1)/"*.png "$BUCKET/products/TLSWD00003/"
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSWD00004 janger Grace dancer mask/"*.png "$BUCKET/products/TLSWD00004/"
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSWD00006-dancing girl/"*.png "$BUCKET/products/TLSWD00006/"
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSWD00007-lotus radiance wood/"*.png "$BUCKET/products/TLSWD00007/"
gsutil -m cp -r "$LOCAL_PATH/Figurines/TLSWD00009-Hand-Carved Cedar Wood Equestrian Horse/"*.png "$BUCKET/products/TLSWD00009/"

# Upload Idols
echo "Uploading Idols..."
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSDV00001-Divine Shiva Brass Idol/"*.png "$BUCKET/products/TLSDV00001/"
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSMG0001_SIdhivinayak white temple/"*.png "$BUCKET/products/TLSMG0001/"
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSMG0002-Sidhivinayak black temple/"*.png "$BUCKET/products/TLSMG0002/"
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSMG0003-Sidhivinayak black temple/"*.png "$BUCKET/products/TLSMG0003/"
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSMG0010-ganpti with shivlinga/"*.png "$BUCKET/products/TLSMG0010/"
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSMT00008-ram bakhat-hanuman/"*.png "$BUCKET/products/TLSMT00008/"
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSMT00015-Ladoo Gopal/"*.png "$BUCKET/products/TLSMT00015/"
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSMT00023- Brass- Ganpati/"*.png "$BUCKET/products/TLSMT00023/"
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSMT00027- brass radha krishna/"*.png "$BUCKET/products/TLSMT00027/"
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSMT00029-divine balance-vishnu ji/"*.png "$BUCKET/products/TLSMT00029/"
gsutil -m cp -r "$LOCAL_PATH/Idols/TLSMT00033-Makhan Chor/"*.png "$BUCKET/products/TLSMT00033/"

# Upload Paintings
echo "Uploading Paintings..."
gsutil -m cp -r "$LOCAL_PATH/Paintings & Prints/Classical/TLSPNT0001-B&W Madhubala oil painting/"*.png "$BUCKET/products/TLSPNT0001/"
gsutil -m cp -r "$LOCAL_PATH/Paintings & Prints/Classical/TLSPNT0002-B&W Nargis oil painting/"*.png "$BUCKET/products/TLSPNT0002/"
gsutil -m cp -r "$LOCAL_PATH/Paintings & Prints/Bold/TLSPNT0003-B&W Abstract oil painting/"*.png "$BUCKET/products/TLSPNT0003/"
gsutil -m cp -r "$LOCAL_PATH/Paintings & Prints/Bold/TLSPNT0004-B&W& red jazz musicoil painting/"*.png "$BUCKET/products/TLSPNT0004/"
gsutil -m cp -r "$LOCAL_PATH/Paintings & Prints/Bold/TLSPNT0005-speed in motion-6 horses/"*.png "$BUCKET/products/TLSPNT0005/"
gsutil -m cp -r "$LOCAL_PATH/Paintings & Prints/Classical/TLSPNT0006- Banaras Ghat Watercolor Painting/"*.png "$BUCKET/products/TLSPNT0006/"
gsutil -m cp -r "$LOCAL_PATH/Paintings & Prints/Classical/TLSPNT0007-madhubani/"*.png "$BUCKET/products/TLSPNT0007/"
gsutil -m cp -r "$LOCAL_PATH/Paintings & Prints/Classical/TLSPNT0008-City of Soul – Framed Urban Watercolor Painting  Vintage Indian Market Scene/"*.png "$BUCKET/products/TLSPNT0008/"
gsutil -m cp -r "$LOCAL_PATH/Paintings & Prints/Classical/TLSPNT0009-Echoes of Devotion\" – Abstract Temple Art in Monochrome Hues/"*.png "$BUCKET/products/TLSPNT0009/"

# Upload Torans
echo "Uploading Torans..."
gsutil -m cp -r "$LOCAL_PATH/Toran/TLSFL00001-Peacock & evil eye/"*.png "$BUCKET/products/TLSFL00001/"
gsutil -m cp -r "$LOCAL_PATH/Toran/TLSFL00002-Orange and Pearl with gold hanging (1)/"*.png "$BUCKET/products/TLSFL00002/"
gsutil -m cp -r "$LOCAL_PATH/Toran/TLSFL00003-Rose+Pearl+hanging/"*.png "$BUCKET/products/TLSFL00003/"

# Upload Wall Decor
echo "Uploading Wall Decor..."
gsutil -m cp -r "$LOCAL_PATH/Wall Decor/TLSMT00001-daisy-flower1/"*.png "$BUCKET/products/TLSMT00001/"
gsutil -m cp -r "$LOCAL_PATH/Wall Decor/TLSMT00002 -owl guardian/"*.png "$BUCKET/products/TLSMT00002/"
gsutil -m cp -r "$LOCAL_PATH/Wall Decor/TLSMT00003-moonwatcher (1)/"*.png "$BUCKET/products/TLSMT00003/"
gsutil -m cp -r "$LOCAL_PATH/Wall Decor/TLSWD00002-wall crucifix/"*.png "$BUCKET/products/TLSWD00002/"
gsutil -m cp -r "$LOCAL_PATH/Wall Decor/TLSWD00008-Hamsa/"*.png "$BUCKET/products/TLSWD00008/"

# Make all images publicly accessible
echo "Setting public access for all images..."
gsutil -m acl ch -u AllUsers:R "$BUCKET/products/**"

echo "Upload complete!"