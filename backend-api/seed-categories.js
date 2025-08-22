const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK with Application Default Credentials
initializeApp({
  projectId: 'tripund-ecommerce-1755860933',
});

const db = getFirestore();

// TRIPUND Categories
const categories = [
  {
    sku: 'TLSFL00001',
    name: 'Festivals',
    slug: 'festivals',
    description: 'Festive decorations and items',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    order: 1,
    children: [
      { name: 'Torans', product_count: 0 },
      { name: 'Door Décor/Hanging', product_count: 0 },
      { name: 'Garlands', product_count: 0 },
      { name: 'Decorations', product_count: 0 },
      { name: 'Rangoli', product_count: 0 },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    sku: 'TLSWD00001',
    name: 'Wall Décor',
    slug: 'wall-decor',
    description: 'Wall decorations and hangings',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
    order: 2,
    children: [
      { name: 'Wall Hangings', product_count: 0 },
      { name: 'Paintings', product_count: 0 },
      { name: 'Frames', product_count: 0 },
      { name: 'Mirrors', product_count: 0 },
      { name: 'Clocks', product_count: 0 },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    sku: 'TLSLT00001',
    name: 'Lighting',
    slug: 'lighting',
    description: 'Decorative lighting solutions',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
    order: 3,
    children: [
      { name: 'Candles', product_count: 0 },
      { name: 'Diyas', product_count: 0 },
      { name: 'Lanterns', product_count: 0 },
      { name: 'Decorative Lights', product_count: 0 },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    sku: 'TLSHA00001',
    name: 'Home Accent',
    slug: 'home-accent',
    description: 'Home decoration accents',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    order: 4,
    children: [
      { name: 'Cushion Covers', product_count: 0 },
      { name: 'Table Décor', product_count: 0 },
      { name: 'Vases', product_count: 0 },
      { name: 'Showpieces', product_count: 0 },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    sku: 'TLSDC00001',
    name: 'Divine Collections',
    slug: 'divine-collections',
    description: 'Religious and spiritual items',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    order: 5,
    children: [
      { name: 'Idols', product_count: 0 },
      { name: 'Pooja Items', product_count: 0 },
      { name: 'Spiritual Décor', product_count: 0 },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    sku: 'TLSSB00001',
    name: 'Storage & Bags',
    slug: 'storage-bags',
    description: 'Storage solutions and bags',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    order: 6,
    children: [
      { name: 'Storage Boxes', product_count: 0 },
      { name: 'Bags', product_count: 0 },
      { name: 'Organizers', product_count: 0 },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    sku: 'TLSGF00001',
    name: 'Gifting',
    slug: 'gifting',
    description: 'Gift items and hampers',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
    order: 7,
    children: [
      { name: 'Gift Sets', product_count: 0 },
      { name: 'Hampers', product_count: 0 },
      { name: 'Personalized Gifts', product_count: 0 },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  },
];

async function seedCategories() {
  console.log('🌱 Starting to seed categories to Firestore...\n');

  try {
    // Clear existing categories
    console.log('📋 Clearing existing categories...');
    const snapshot = await db.collection('categories').get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`✓ Deleted ${snapshot.size} existing categories\n`);

    // Add new categories
    console.log('📝 Adding TRIPUND categories to Firestore...');
    for (const category of categories) {
      const docRef = await db.collection('categories').add(category);
      console.log(`✓ Added: ${category.name} (${category.sku}) - ID: ${docRef.id}`);
    }

    // Verify categories
    console.log('\n🔍 Verifying categories in Firestore...');
    const verifySnapshot = await db.collection('categories').orderBy('order').get();
    
    console.log(`\n✅ Successfully stored ${verifySnapshot.size} categories:`);
    verifySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${data.name} (${data.sku}) with ${data.children.length} subcategories`);
    });

    console.log('\n🎉 Categories successfully stored in Firestore!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();