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
    
    // Initialize FAQs content
    const faqsContent = {
      type: 'faqs',
      faqs: [
        {
          id: '1',
          question: 'What makes TRIPUND products unique?',
          answer: 'All our products are handcrafted by skilled Indian artisans using traditional techniques passed down through generations. Each piece is unique and tells a story of Indian heritage and craftsmanship.',
          category: 'General',
          order: 1,
          active: true
        },
        {
          id: '2',
          question: 'How long does shipping take?',
          answer: 'We typically ship within 2-3 business days. Delivery times vary based on location: Metro cities (3-5 days), Other cities (5-7 days), Remote areas (7-10 days).',
          category: 'Shipping',
          order: 2,
          active: true
        },
        {
          id: '3',
          question: 'What is your return policy?',
          answer: 'We accept returns within 7 days of delivery for unused items in original packaging. Custom or personalized items cannot be returned unless defective. Return shipping costs are borne by the customer.',
          category: 'Returns',
          order: 3,
          active: true
        },
        {
          id: '4',
          question: 'Do you offer Cash on Delivery?',
          answer: 'Yes, we offer Cash on Delivery for orders up to ₹10,000. Additional charges may apply based on the order value and delivery location.',
          category: 'Payment',
          order: 4,
          active: true
        },
        {
          id: '5',
          question: 'How can I track my order?',
          answer: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can use this number to track your order on our website or the courier partner\'s website.',
          category: 'Orders',
          order: 5,
          active: true
        },
        {
          id: '6',
          question: 'Are the product colors accurate?',
          answer: 'We strive to display accurate colors, but slight variations may occur due to monitor settings and lighting conditions. Handcrafted items may also have natural variations in color and pattern.',
          category: 'Products',
          order: 6,
          active: true
        },
        {
          id: '7',
          question: 'Can I cancel my order?',
          answer: 'Orders can be cancelled within 24 hours of placement. Once shipped, orders cannot be cancelled. Custom or personalized orders cannot be cancelled once production begins.',
          category: 'Orders',
          order: 7,
          active: true
        },
        {
          id: '8',
          question: 'Do you ship internationally?',
          answer: 'Currently, we only ship within India. We are working on expanding our services to international markets soon.',
          category: 'Shipping',
          order: 8,
          active: true
        },
        {
          id: '9',
          question: 'How do I care for handcrafted products?',
          answer: 'Care instructions vary by product type. Each product comes with specific care guidelines. Generally, avoid direct sunlight, moisture, and harsh chemicals. Dust regularly with a soft, dry cloth.',
          category: 'Products',
          order: 9,
          active: true
        },
        {
          id: '10',
          question: 'Can I request custom designs?',
          answer: 'Yes, we accept custom orders for many of our product categories. Please contact us with your requirements and we\'ll connect you with the right artisan. Custom orders may take 2-4 weeks.',
          category: 'Products',
          order: 10,
          active: true
        }
      ],
      updated_at: new Date()
    };
    
    // Always update FAQs content to ensure it has all fields
    await db.collection('content').doc('faqs').set(faqsContent);
    console.log('✅ FAQs content initialized/updated');
    
    console.log('✅ Default content initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing content:', error);
    process.exit(1);
  }
}

initializeDefaultContent();