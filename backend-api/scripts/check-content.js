const admin = require('firebase-admin');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'tripund-ecommerce-1755860933'
});

const db = admin.firestore();

async function checkContent() {
  try {
    console.log('Checking content in Firestore...\n');
    
    // Check shipping content
    const shippingDoc = await db.collection('content').doc('shipping').get();
    if (shippingDoc.exists) {
      const shippingData = shippingDoc.data();
      console.log('📦 Shipping Content:');
      console.log('  Title:', shippingData.title);
      console.log('  Zones:', shippingData.zones?.length || 0, 'zones');
      console.log('  Has express shipping:', !!shippingData.expressShipping);
      console.log('  Has restrictions:', Array.isArray(shippingData.restrictions));
      console.log('');
    } else {
      console.log('❌ No shipping content found\n');
    }
    
    // Check returns content
    const returnsDoc = await db.collection('content').doc('returns').get();
    if (returnsDoc.exists) {
      const returnsData = returnsDoc.data();
      console.log('↩️  Returns Content:');
      console.log('  Title:', returnsData.title);
      console.log('  Return Window:', returnsData.returnWindow);
      console.log('  Process steps:', returnsData.process?.length || 0);
      console.log('  Eligible items:', returnsData.eligibleItems?.length || 0);
      console.log('  Non-returnable items:', returnsData.nonReturnableItems?.length || 0);
      console.log('  Refund methods:', returnsData.refundMethods?.length || 0);
      console.log('  Has exchange policy:', !!returnsData.exchangePolicy);
      console.log('  Has damage policy:', !!returnsData.damagePolicy);
      console.log('\nFull returns data:');
      console.log(JSON.stringify(returnsData, null, 2));
    } else {
      console.log('❌ No returns content found');
    }
    
    // Check FAQs content
    const faqsDoc = await db.collection('content').doc('faqs').get();
    if (faqsDoc.exists) {
      const faqsData = faqsDoc.data();
      console.log('\n❓ FAQs Content:');
      console.log('  Number of FAQs:', faqsData.faqs?.length || 0);
      if (faqsData.faqs && faqsData.faqs.length > 0) {
        console.log('  Sample FAQ:');
        console.log('    Question:', faqsData.faqs[0].question);
        console.log('    Category:', faqsData.faqs[0].category);
      }
      console.log('  Categories:', [...new Set(faqsData.faqs?.map(f => f.category) || [])].join(', '));
    } else {
      console.log('\n❌ No FAQs content found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking content:', error);
    process.exit(1);
  }
}

checkContent();