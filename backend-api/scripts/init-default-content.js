const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'tripund-ecommerce-1755860933'
});

const db = admin.firestore();

async function initializeDefaultContent() {
  try {
    console.log('Initializing default content in Firestore...');
    
    // Initialize shipping content
    const shippingContent = {
      title: 'Shipping Information',
      subtitle: 'We deliver handcrafted treasures across India',
      deliveryTime: '5-7 business days for most locations',
      zones: [
        { zone: 'Metro Cities', delivery: '3-5 days', charges: 'Free above ₹2000' },
        { zone: 'Tier 1 Cities', delivery: '5-7 days', charges: '₹100' },
        { zone: 'Tier 2/3 Cities', delivery: '7-10 days', charges: '₹150' },
        { zone: 'Remote Areas', delivery: '10-15 days', charges: '₹200' }
      ],
      freeShippingThreshold: 2000,
      expressShipping: {
        available: true,
        charges: 200,
        delivery: '2-3 business days'
      },
      trackingInfo: 'You will receive tracking details via email and SMS once your order is dispatched.',
      packagingNote: 'All items are carefully packaged to ensure they reach you in perfect condition.',
      restrictions: ['We currently ship only within India', 'P.O. Box addresses are not accepted'],
      contactSupport: 'For shipping queries, contact us at shipping@tripundlifestyle.com',
      type: 'shipping',
      updated_at: new Date()
    };
    
    // Initialize returns content
    const returnsContent = {
      title: 'Returns & Exchanges',
      subtitle: 'Your satisfaction is our priority',
      returnWindow: '7 days',
      eligibleItems: [
        'Items in original condition with tags',
        'Unused and unwashed products',
        'Items with original packaging'
      ],
      nonReturnableItems: [
        'Customized or personalized products',
        'Items marked as final sale',
        'Digital gift cards',
        'Intimate apparel and jewelry'
      ],
      process: [
        'Initiate return request within 7 days of delivery',
        'Pack the item securely with all original tags',
        'Our courier partner will pick up the item',
        'Refund processed within 5-7 business days after inspection'
      ],
      exchangePolicy: 'Exchanges are available for size/color variations subject to availability.',
      refundMethods: [
        'Original payment method (5-7 days)',
        'Store credit (instant)',
        'Bank transfer (7-10 days)'
      ],
      damagePolicy: 'For damaged or defective items, report within 48 hours with photos for immediate resolution.',
      contactSupport: 'For returns & exchanges, email us at returns@tripundlifestyle.com',
      type: 'returns',
      updated_at: new Date()
    };
    
    // Check if shipping content exists
    const shippingDoc = await db.collection('content').doc('shipping').get();
    if (!shippingDoc.exists) {
      await db.collection('content').doc('shipping').set(shippingContent);
      console.log('✅ Shipping content initialized');
    } else {
      console.log('ℹ️  Shipping content already exists');
    }
    
    // Always update returns content to ensure it has all fields
    await db.collection('content').doc('returns').set(returnsContent);
    console.log('✅ Returns content initialized/updated');
    
    console.log('✅ Default content initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing content:', error);
    process.exit(1);
  }
}

initializeDefaultContent();