const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  projectId: 'tripund-ecommerce-1755860933'
});

const db = admin.firestore();

// Map SKUs to their image folders
const skuToImages = {
  // Figurines
  'TLSHAF00001': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSHAF00001/TLSHAF00001-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSHAF00001/TLSHAF00001-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSHAF00001/TLSHAF00001-3.png'
  ],
  'TLSHAF00002': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSHAF00002/TLSHAF00002-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSHAF00002/TLSHAF00002-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSHAF00002/TLSHAF00002-3.png'
  ],
  'TLSMG0001': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0001/TLSMG0001-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0001/TLSMG0001-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0001/TLSMG0001-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0001/TLSMG0001-4.png'
  ],
  'TLSMG0007': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0007/TLSMG0007.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0007/TLSMG0007-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0007/TLSMG0007-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0007/TLSMG0007-4.png'
  ],
  'TLSMG0009': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0009/TLSMG0009.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0009/TLSMG0009-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0009/TLSMG0009-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0009/TLSMG0009-4.png'
  ],
  'TLSMG0013': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0013/TLSMG0013-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0013/TLSMG0013-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0013/TLSMG0013-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0013/TLSMG0013-4.png'
  ],
  'TLSRN00001': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSRN00001/TLSRN00001-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSRN00001/TLSRN00001-2.png'
  ],
  'TLSRN00002': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSRN00002/TLSRN00002-1.jpg',
    'https://storage.googleapis.com/tripund-product-images/products/TLSRN00002/TLSRN00002-2.jpg',
    'https://storage.googleapis.com/tripund-product-images/products/TLSRN00002/TLSRN00002-3.jpg',
    'https://storage.googleapis.com/tripund-product-images/products/TLSRN00002/TLSRN00002-4.jpg'
  ],
  'TLSWD00001': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00001/TLSWD00001-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00001/TLSWD00001-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00001/TLSWD00001-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00001/TLSWD00001-4.png'
  ],
  'TLSWD00003': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00003/TLSWD00003-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00003/TLSWD00003-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00003/TLSWD00003-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00003/TLSWD00003-4.png'
  ],
  'TLSWD00004': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00004/TLSWD00004.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00004/TLSWD00004-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00004/TLSWD00004-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00004/TLSWD00004-4.png'
  ],
  'TLSWD00006': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00006/TLSWD00006-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00006/TLSWD00006-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00006/TLSWD00006-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00006/TLSWD00006-4.png'
  ],
  'TLSWD00007': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00007/TLSWD00007.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00007/TLSWD00007-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00007/TLSWD00007-3.png'
  ],
  'TLSWD00009': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00009/TLSWD00009-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00009/TLSWD00009-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00009/TLSWD00009-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00009/TLSWD00009-4.png'
  ],
  'TLSMT00002': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00002/TLSMT00002.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00002/TLSMT00002-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00002/TLSMT00002-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00002/TLSMT00002-3.png'
  ],
  // Idols
  'TLSDV00001': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSDV00001/TLSDV00001-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSDV00001/TLSDV00001-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSDV00001/TLSDV00001-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSDV00001/TLSDV00001-4.png'
  ],
  'TLSMG0001': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0001/TLSMG0001-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0001/TLSMG0001-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0001/TLSMG0001-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0001/TLSMG0001-4.png'
  ],
  'TLSMG0002': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0002/TLSMG0002-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0002/TLSMG0002-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0002/TLSMG0002-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0002/TLSMG0002-4.png'
  ],
  'TLSMG0003': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0003/TLSMG0003-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0003/TLSMG0003-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0003/TLSMG0003-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0003/TLSMG0003-4.png'
  ],
  'TLSMG0010': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0010/TLSMG0010.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0010/TLSMG0010-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0010/TLSMG0010-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMG0010/TLSMG0010-4.png'
  ],
  'TLSMT00008': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00008/TLSMT00008.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00008/TLSMT00008-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00008/TLSMT00008-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00008/TLSMT00008-4.png'
  ],
  'TLSMT00015': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00015/TLSMT00015-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00015/TLSMT00015-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00015/TLSMT00015-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00015/TLSMT00015-4.png'
  ],
  'TLSMT00023': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00023/TLSMT00023-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00023/TLSMT00023-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00023/TLSMT00023-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00023/TLSMT00023-4.png'
  ],
  'TLSMT00027': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00027/TLSMT00027.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00027/TLSMT00027-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00027/TLSMT00027-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00027/TLSMT00027-4.png'
  ],
  'TLSMT00029': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00029/TLSMT00029.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00029/TLSMT00029-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00029/TLSMT00029-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00029/TLSMT00029-4.png'
  ],
  'TLSMT00033': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00033/TLSMT00033-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00033/TLSMT00033-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00033/TLSMT00033-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00033/TLSMT00033-4.png'
  ],
  // Paintings
  'TLSPNT0001': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0001/TLSPNT0001-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0001/TLSPNT0001-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0001/TLSPNT0001-3.png'
  ],
  'TLSPNT0002': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0002/TLSPNT0002.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0002/TLSPNT0002-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0002/TLSPNT0002-2.png'
  ],
  'TLSPNT0003': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0003/TLSPNT0003.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0003/TLSPNT0003-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0003/TLSPNT0003-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0003/TLSPNT0003-4.png'
  ],
  'TLSPNT0004': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0004/TLSPNT0004.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0004/TLSPNT0004-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0004/TLSPNT0004-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0004/TLSPNT0004-4.png'
  ],
  'TLSPNT0005': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0005/TLSPNT0005.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0005/TLSPNT0005-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0005/TLSPNT0005-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0005/TLSPNT0005-4.png'
  ],
  'TLSPNT0006': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0006/TLSPNT0006-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0006/TLSPNT0006-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0006/TLSPNT0006-3.png'
  ],
  'TLSPNT0007': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0007/TLSPNT0007.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0007/TLSPNT0007A-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0007/TLSPNT0007A-2.png'
  ],
  'TLSPNT0008': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0008/TLSPNT0008-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0008/TLSPNT0008-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0008/TLSPNT0008-3.png'
  ],
  'TLSPNT0009': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0009/TLSPNT0009-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0009/TLSPNT0009-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSPNT0009/TLSPNT0009-3.png'
  ],
  // Torans
  'TLSFL00001': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSFL00001/TLSFL00001.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSFL00001/TLSFL00001-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSFL00001/TLSFL00001-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSFL00001/TLSFL00001-3.png'
  ],
  'TLSFL00002': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSFL00002/TLSFL00002-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSFL00002/TLSFL00002-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSFL00002/TLSFL00002-4.png'
  ],
  'TLSFL00003': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSFL00003/TLSFL00003-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSFL00003/TLSFL00003-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSFL00003/TLSFL00003-3.png'
  ],
  // Wall Decor
  'TLSMT00001': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00001/TLSMT00001.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00001/TLSMT00001-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00001/TLSMT00001-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00001/TLSMT00001-3.png'
  ],
  'TLSMT00002': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00002/TLSMT00002.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00002/TLSMT00002-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00002/TLSMT00002-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00002/TLSMT00002-3.png'
  ],
  'TLSMT00003': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00003/TLSMT00003-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00003/TLSMT00003-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00003/TLSMT00003-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSMT00003/TLSMT00003-4.png'
  ],
  'TLSWD00002': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00002/TLSWD00002.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00002/TLSWD00002-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00002/TLSWD00002-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00002/TLSWD00002-4.png'
  ],
  'TLSWD00008': [
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00008/TLSWD00008-1.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00008/TLSWD00008-2.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00008/TLSWD00008-3.png',
    'https://storage.googleapis.com/tripund-product-images/products/TLSWD00008/TLSWD00008-4.png'
  ]
};

// Handle special cases for mismatched SKUs
const skuMapping = {
  'TLSMG0001_SIdhivinayak white temple': 'TLSMG0001',
  'TLSWD00004 janger Grace dancer mask': 'TLSWD00004',
  'TLSWD00001 ': 'TLSWD00001',
  'TLSMT00002 ': 'TLSMT00002',
  'TLSMG0007 Subh aarambh white silver Copy': 'TLSMG0007'
};

async function updateProductImages() {
  console.log('Starting product image update...\n');
  
  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();
  
  let updated = 0;
  let skipped = 0;
  
  for (const doc of snapshot.docs) {
    const product = doc.data();
    let sku = product.sku;
    
    // Check if SKU needs mapping
    if (skuMapping[sku]) {
      sku = skuMapping[sku];
    }
    
    if (skuToImages[sku]) {
      console.log(`Updating ${sku}: ${product.name}`);
      await doc.ref.update({
        images: skuToImages[sku]
      });
      updated++;
    } else {
      console.log(`No images found for SKU: ${sku}`);
      skipped++;
    }
  }
  
  console.log(`\n✅ Update complete!`);
  console.log(`Updated: ${updated} products`);
  console.log(`Skipped: ${skipped} products`);
  
  process.exit(0);
}

updateProductImages().catch(console.error);