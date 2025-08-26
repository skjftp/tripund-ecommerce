const admin = require('firebase-admin');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  projectId: 'tripund-ecommerce-1755860933',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function fixCategoryTimestamps() {
  try {
    console.log('Fetching all categories...');
    const snapshot = await db.collection('categories').get();
    
    console.log(`Found ${snapshot.size} categories\n`);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`Processing category: ${data.name} (${doc.id})`);
      
      let updates = {};
      let hasUpdates = false;
      
      // Check created_at field
      if (data.created_at && typeof data.created_at === 'string') {
        console.log(`  Found string created_at: ${data.created_at}`);
        try {
          // Parse the string timestamp and convert to Firestore Timestamp
          const date = new Date(data.created_at);
          updates.created_at = admin.firestore.Timestamp.fromDate(date);
          hasUpdates = true;
          console.log(`  ✓ Converted created_at to Timestamp`);
        } catch (error) {
          console.log(`  ✗ Failed to convert created_at: ${error.message}`);
        }
      }
      
      // Check updated_at field
      if (data.updated_at && typeof data.updated_at === 'string') {
        console.log(`  Found string updated_at: ${data.updated_at}`);
        try {
          // Parse the string timestamp and convert to Firestore Timestamp
          const date = new Date(data.updated_at);
          updates.updated_at = admin.firestore.Timestamp.fromDate(date);
          hasUpdates = true;
          console.log(`  ✓ Converted updated_at to Timestamp`);
        } catch (error) {
          console.log(`  ✗ Failed to convert updated_at: ${error.message}`);
        }
      }
      
      // Update the document if we have changes
      if (hasUpdates) {
        await doc.ref.update(updates);
        console.log(`  ✓ Updated category timestamps\n`);
      } else {
        console.log(`  No timestamp updates needed\n`);
      }
    }
    
    console.log('✅ All category timestamps fixed successfully!');
    
    // Verify the fix
    console.log('\nVerifying categories...');
    const verifySnapshot = await db.collection('categories').get();
    
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name}:`);
      console.log(`    created_at: ${typeof data.created_at === 'object' ? '✅ Timestamp' : '❌ ' + typeof data.created_at}`);
      console.log(`    updated_at: ${typeof data.updated_at === 'object' ? '✅ Timestamp' : '❌ ' + typeof data.updated_at}`);
    });
    
  } catch (error) {
    console.error('Error fixing category timestamps:', error);
  } finally {
    process.exit();
  }
}

fixCategoryTimestamps();