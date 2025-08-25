const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  projectId: 'tripund-ecommerce-1755860933'
});

const db = admin.firestore();
const storage = new Storage({
  projectId: 'tripund-ecommerce-1755860933'
});

const bucket = storage.bucket('tripund-product-images');

// Mapping of category names to image filenames
const categoryImageMap = {
  'Festivals': 'festivals.png',
  'Wall Décor': 'wall-decor.png', 
  'Lighting': 'lighting.png',
  'Home Accent': 'home-accent.png',
  'Divine Collections': 'divine-collections.png',
  'Storage & Bags': 'storage-bags.png',
  'Gifting': 'gifting.png'
};

async function base64ToFile(base64Data, filename) {
  // Remove data:image/jpeg;base64, or data:image/png;base64, prefix
  const base64WithoutPrefix = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  const buffer = Buffer.from(base64WithoutPrefix, 'base64');
  
  const tempPath = path.join(__dirname, 'temp', filename);
  
  // Ensure temp directory exists
  const tempDir = path.dirname(tempPath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

async function uploadImageToBucket(localFilePath, bucketPath) {
  try {
    await bucket.upload(localFilePath, {
      destination: bucketPath,
      metadata: {
        cacheControl: 'public, max-age=31536000', // 1 year cache
      }
    });
    
    // Clean up local file
    fs.unlinkSync(localFilePath);
    
    // Use direct GCS URL since CDN DNS isn't configured yet
    return `https://storage.googleapis.com/tripund-product-images/${bucketPath}`;
  } catch (error) {
    console.error(`Error uploading ${bucketPath}:`, error);
    // Clean up local file on error too
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error;
  }
}

async function updateCategoryImages() {
  console.log('Starting category image update process...\n');
  
  const categoriesRef = db.collection('categories');
  const snapshot = await categoriesRef.get();
  
  let updated = 0;
  let failed = 0;
  
  for (const doc of snapshot.docs) {
    const category = doc.data();
    const categoryName = category.name;
    
    console.log(`Processing category: ${categoryName}`);
    
    // Check if category has base64 image data
    if (category.image && category.image.startsWith('data:image/')) {
      try {
        const imageFilename = categoryImageMap[categoryName] || `${category.slug}.png`;
        
        // Convert base64 to file
        console.log(`  Converting base64 to file: ${imageFilename}`);
        const tempFilePath = await base64ToFile(category.image, imageFilename);
        
        // Upload to bucket under categories folder
        const bucketPath = `categories/${imageFilename}`;
        console.log(`  Uploading to: ${bucketPath}`);
        const cdnUrl = await uploadImageToBucket(tempFilePath, bucketPath);
        
        // Update Firestore document with CDN URL
        console.log(`  Updating Firestore with CDN URL: ${cdnUrl}`);
        await doc.ref.update({
          image: cdnUrl
        });
        
        console.log(`  ✅ Successfully updated ${categoryName}`);
        updated++;
        
      } catch (error) {
        console.error(`  ❌ Failed to process ${categoryName}:`, error);
        failed++;
      }
    } else if (category.image && category.image.startsWith('https://')) {
      console.log(`  ✅ Already has CDN URL: ${category.image}`);
    } else {
      console.log(`  ⚠️  No image data found`);
    }
    
    console.log('');
  }
  
  console.log(`\n🎉 Category image update complete!`);
  console.log(`✅ Updated: ${updated} categories`);
  console.log(`❌ Failed: ${failed} categories`);
  
  // Clean up temp directory
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  process.exit(0);
}

updateCategoryImages().catch(console.error);