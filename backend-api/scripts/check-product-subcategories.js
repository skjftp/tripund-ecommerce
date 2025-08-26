const admin = require('firebase-admin');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  projectId: 'tripund-ecommerce-1755860933',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function checkProductSubcategories() {
  try {
    console.log('Checking products with subcategories...\n');
    
    // Get all products
    const snapshot = await db.collection('products').limit(20).get();
    
    let productsWithSubcategories = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.subcategories && data.subcategories.length > 0) {
        productsWithSubcategories++;
        console.log(`Product: ${data.name || data.sku}`);
        console.log(`  SKU: ${data.sku}`);
        console.log(`  Subcategories: ${JSON.stringify(data.subcategories)}`);
        console.log('');
      }
    });
    
    console.log(`\nTotal products with subcategories: ${productsWithSubcategories} out of ${snapshot.size}`);
    
    // Check specific product TLSWD00004
    console.log('\nChecking specific product TLSWD00004:');
    const productQuery = await db.collection('products').where('sku', '==', 'TLSWD00004').get();
    
    if (!productQuery.empty) {
      const productDoc = productQuery.docs[0];
      const productData = productDoc.data();
      console.log(`  Name: ${productData.name}`);
      console.log(`  Has subcategories field: ${productData.hasOwnProperty('subcategories')}`);
      console.log(`  Subcategories value: ${JSON.stringify(productData.subcategories)}`);
    } else {
      console.log('  Product not found');
    }
    
  } catch (error) {
    console.error('Error checking products:', error);
  } finally {
    process.exit();
  }
}

checkProductSubcategories();