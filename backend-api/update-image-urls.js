const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  projectId: 'tripund-ecommerce-1755860933'
});

const db = admin.firestore();
const storage = new Storage({
  projectId: 'tripund-ecommerce-1755860933'
});

const bucket = storage.bucket('tripund-product-images');

async function getImagesForSKU(sku) {
  try {
    const [files] = await bucket.getFiles({
      prefix: `products/${sku}/`
    });
    
    const imageUrls = files
      .filter(file => file.name.endsWith('.png') || file.name.endsWith('.jpg'))
      .map(file => `https://storage.googleapis.com/tripund-product-images/${file.name}`)
      .sort(); // Sort to ensure consistent order
    
    return imageUrls;
  } catch (error) {
    console.error(`Error getting images for ${sku}:`, error);
    return [];
  }
}

async function updateProductImages() {
  console.log('Starting product image URL update...\n');
  
  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();
  
  let updated = 0;
  let failed = 0;
  
  for (const doc of snapshot.docs) {
    const product = doc.data();
    let sku = product.sku;
    
    // Clean up SKU for folder lookup
    if (sku.includes('_')) {
      sku = sku.split('_')[0]; // Handle TLSMG0001_SIdhivinayak case
    }
    if (sku.includes(' ')) {
      sku = sku.split(' ')[0]; // Handle "TLSWD00004 janger Grace dancer mask" case
    }
    
    console.log(`Checking images for ${sku}: ${product.name}`);
    
    const imageUrls = await getImagesForSKU(sku);
    
    if (imageUrls.length > 0) {
      console.log(`  Found ${imageUrls.length} images`);
      await doc.ref.update({
        images: imageUrls
      });
      updated++;
    } else {
      console.log(`  No images found`);
      failed++;
    }
  }
  
  console.log(`\n✅ Update complete!`);
  console.log(`Updated: ${updated} products`);
  console.log(`Failed: ${failed} products`);
  
  process.exit(0);
}

updateProductImages().catch(console.error);