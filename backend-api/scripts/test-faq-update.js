const admin = require('firebase-admin');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'tripund-ecommerce-1755860933'
});

const db = admin.firestore();

async function testFAQUpdate() {
  try {
    console.log('Testing FAQ update...\n');
    
    // First, get current FAQs
    const beforeDoc = await db.collection('content').doc('faqs').get();
    const beforeData = beforeDoc.data();
    console.log('BEFORE Update:');
    console.log('  Number of FAQs:', beforeData?.faqs?.length || 0);
    if (beforeData?.faqs?.[0]) {
      console.log('  First FAQ question:', beforeData.faqs[0].question);
      console.log('  First FAQ answer:', beforeData.faqs[0].answer.substring(0, 50) + '...');
    }
    console.log('  Last updated:', beforeData?.updated_at);
    
    // Now update with a test change
    const testFAQs = beforeData?.faqs || [];
    if (testFAQs.length > 0) {
      // Modify the first FAQ to test
      testFAQs[0] = {
        ...testFAQs[0],
        answer: 'TEST ANSWER - Updated at ' + new Date().toISOString()
      };
    }
    
    // Save the updated FAQs (mimicking what the backend does)
    const updateContent = {
      type: 'faqs',
      faqs: testFAQs,
      updated_at: new Date(),
      updated_by: 'test-script'
    };
    
    await db.collection('content').doc('faqs').set(updateContent);
    console.log('\n✅ Update completed');
    
    // Fetch again to verify
    const afterDoc = await db.collection('content').doc('faqs').get();
    const afterData = afterDoc.data();
    console.log('\nAFTER Update:');
    console.log('  Number of FAQs:', afterData?.faqs?.length || 0);
    if (afterData?.faqs?.[0]) {
      console.log('  First FAQ question:', afterData.faqs[0].question);
      console.log('  First FAQ answer:', afterData.faqs[0].answer.substring(0, 50) + '...');
    }
    console.log('  Last updated:', afterData?.updated_at);
    console.log('  Updated by:', afterData?.updated_by);
    
    // Restore original if needed
    console.log('\n⏮️  Restoring original content...');
    await db.collection('content').doc('faqs').set(beforeData);
    console.log('✅ Original content restored');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing FAQ update:', error);
    process.exit(1);
  }
}

testFAQUpdate();