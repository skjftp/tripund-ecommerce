const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
initializeApp({
  projectId: 'tripund-ecommerce-1755860933',
});

const db = getFirestore();

async function checkProducts() {
  try {
    console.log('🔍 Checking products in Firestore...\n');
    
    const snapshot = await db.collection('products').limit(5).get();
    
    console.log(`📊 Found ${snapshot.size} products in database\n`);
    
    if (snapshot.size > 0) {
      console.log('📋 Sample products:');
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ${data.name} (${data.sku})`);
        console.log(`   Categories: ${JSON.stringify(data.categories)}`);
        console.log(`   Images: ${data.images?.length || 0} images`);
        console.log(`   Status: ${data.status}`);
        console.log('');
      });
    } else {
      console.log('❌ No products found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProducts();