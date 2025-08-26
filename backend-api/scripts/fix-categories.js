const admin = require('firebase-admin');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  projectId: 'tripund-ecommerce-1755860933',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function fixCategories() {
  try {
    console.log('Fetching all categories...');
    const snapshot = await db.collection('categories').get();
    
    console.log(`Found ${snapshot.size} categories`);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`\nProcessing category: ${doc.id}`);
      console.log(`  Name: ${data.name}`);
      
      // Check if document has an 'id' field in its data
      if (data.id) {
        console.log(`  Found duplicate 'id' field: ${data.id}`);
        
        // Remove the 'id' field from the document data
        await doc.ref.update({
          id: admin.firestore.FieldValue.delete()
        });
        
        console.log(`  ✓ Removed duplicate 'id' field`);
      } else {
        console.log(`  No duplicate 'id' field found`);
      }
    }
    
    console.log('\n✅ All categories fixed successfully!');
    
    // Verify the fix
    console.log('\nVerifying categories...');
    const verifySnapshot = await db.collection('categories').get();
    console.log(`Total categories after fix: ${verifySnapshot.size}`);
    
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name}: ${data.id ? '❌ Still has id field' : '✅ Clean'}`);
    });
    
  } catch (error) {
    console.error('Error fixing categories:', error);
  } finally {
    process.exit();
  }
}

fixCategories();