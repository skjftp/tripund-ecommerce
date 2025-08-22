const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
initializeApp({
  projectId: 'tripund-ecommerce-1755860933',
});

const db = getFirestore();

// Base paths
const BASE_PATH = '/Users/sumitjha/Dropbox/Mac/Documents/Projects/tripund-ecommerce/Category and Product Images';

// Category mappings to determine which category each product belongs to
const categoryMappings = {
  'Figurines': 'divine-collections', // TLSDC00001
  'Idols': 'divine-collections',     // TLSDC00001  
  'Paintings & Prints/Bold': 'wall-decor',      // TLSWD00001
  'Paintings & Prints/Classical': 'wall-decor', // TLSWD00001
  'Toran': 'festivals',              // TLSFL00001
  'Wall Decor': 'wall-decor'         // TLSWD00001
};

// Function to extract product name from folder name
function extractProductName(folderName) {
  // Remove SKU prefix and clean up the name
  const parts = folderName.split('-');
  if (parts.length > 1) {
    parts.shift(); // Remove SKU
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }
  return folderName;
}

// Function to get all image files for a product
function getProductImages(productDir, productSku) {
  const imageExtensions = ['.png', '.jpg', '.jpeg'];
  const files = fs.readdirSync(productDir);
  
  return files
    .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
    .map(file => `https://images.tripundlifestyle.com/products/${productSku}/${file}`)
    .sort(); // Sort to have consistent order
}

// Function to generate sample product data
function generateProductData(productSku, productName, category, images) {
  // Generate realistic prices based on category
  const basePrices = {
    'divine-collections': [1200, 2500, 4500, 3200, 1800],
    'wall-decor': [800, 1500, 2200, 1100, 900],
    'festivals': [600, 1200, 800, 950, 750]
  };
  
  const prices = basePrices[category] || [1000, 2000, 1500];
  const price = prices[Math.floor(Math.random() * prices.length)];
  
  // Generate product descriptions based on category
  const descriptions = {
    'divine-collections': [
      'Handcrafted spiritual sculpture made with traditional techniques passed down through generations.',
      'Beautiful brass idol perfect for home temples and meditation spaces.',
      'Exquisite divine figurine representing peace, prosperity and spiritual harmony.',
      'Premium quality religious artifact crafted by skilled Indian artisans.',
      'Sacred sculpture bringing divine blessings and positive energy to your home.'
    ],
    'wall-decor': [
      'Stunning wall art piece that transforms any space with its artistic elegance.',
      'Contemporary wall decoration combining traditional craftsmanship with modern aesthetics.',
      'Eye-catching wall sculpture that serves as a focal point in any room.',
      'Artistic wall hanging showcasing intricate details and masterful craftsmanship.',
      'Decorative wall piece that adds cultural richness and visual appeal to your space.'
    ],
    'festivals': [
      'Beautiful traditional decoration perfect for festive celebrations and special occasions.',
      'Handmade festival ornament that brings joy and cultural authenticity to your celebrations.',
      'Colorful decorative piece ideal for creating a festive atmosphere in your home.',
      'Traditional festival decoration crafted with vibrant colors and intricate patterns.',
      'Authentic cultural ornament that enhances the beauty of your festive decorations.'
    ]
  };
  
  const categoryDescriptions = descriptions[category] || descriptions['divine-collections'];
  const description = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
  
  return {
    sku: productSku,
    name: productName,
    slug: productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    description: description,
    short_description: description.substring(0, 150) + '...',
    price: price,
    sale_price: null,
    manage_stock: true,
    stock_quantity: Math.floor(Math.random() * 50) + 10,
    stock_status: 'in_stock',
    featured: Math.random() < 0.3, // 30% chance of being featured
    status: 'active',
    images: images,
    categories: [category],
    tags: [],
    attributes: [
      {
        name: 'Material',
        value: category === 'divine-collections' ? 'Brass/Polyresin' : 
               category === 'wall-decor' ? 'Canvas/Wood/Metal' : 'Fabric/Beads'
      },
      {
        name: 'Origin',
        value: 'India'
      },
      {
        name: 'Handmade',
        value: 'Yes'
      }
    ],
    dimensions: {
      length: Math.floor(Math.random() * 20) + 10,
      width: Math.floor(Math.random() * 20) + 10,
      height: Math.floor(Math.random() * 15) + 5,
      unit: 'cm'
    },
    weight: {
      value: Math.floor(Math.random() * 2000) + 200,
      unit: 'g'
    },
    created_at: new Date(),
    updated_at: new Date()
  };
}

// Function to process products from a category directory
async function processCategory(categoryPath, categoryKey) {
  console.log(`📁 Processing category: ${categoryKey}`);
  
  if (!fs.existsSync(categoryPath)) {
    console.log(`⚠️  Category path does not exist: ${categoryPath}`);
    return;
  }
  
  const categorySlug = categoryMappings[categoryKey];
  if (!categorySlug) {
    console.log(`⚠️  No category mapping found for: ${categoryKey}`);
    return;
  }
  
  const productDirs = fs.readdirSync(categoryPath)
    .filter(item => fs.statSync(path.join(categoryPath, item)).isDirectory());
  
  console.log(`  Found ${productDirs.length} products`);
  
  for (const productDir of productDirs) {
    const fullProductPath = path.join(categoryPath, productDir);
    
    // Extract SKU from folder name
    const productSku = productDir.split('-')[0];
    const productName = extractProductName(productDir);
    
    // Get product images
    const images = getProductImages(fullProductPath, productSku);
    
    if (images.length === 0) {
      console.log(`  ⚠️  No images found for ${productSku}, skipping...`);
      continue;
    }
    
    // Generate product data
    const productData = generateProductData(productSku, productName, categorySlug, images);
    
    try {
      // Check if product already exists
      const existingProduct = await db.collection('products').where('sku', '==', productSku).get();
      
      if (!existingProduct.empty) {
        console.log(`  📦 Product ${productSku} already exists, updating...`);
        const docRef = existingProduct.docs[0].ref;
        await docRef.update({
          ...productData,
          updated_at: new Date()
        });
        console.log(`  ✅ Updated: ${productSku} - ${productName}`);
      } else {
        // Create new product
        const docRef = await db.collection('products').add(productData);
        console.log(`  ✅ Created: ${productSku} - ${productName} (ID: ${docRef.id})`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${productSku}:`, error.message);
    }
  }
}

// Main function to create all products
async function createProducts() {
  console.log('🏭 Creating products from Category and Product Images folder...\n');
  
  try {
    // Process each category
    await processCategory(path.join(BASE_PATH, 'Figurines'), 'Figurines');
    await processCategory(path.join(BASE_PATH, 'Idols'), 'Idols');
    await processCategory(path.join(BASE_PATH, 'Paintings & Prints', 'Bold'), 'Paintings & Prints/Bold');
    await processCategory(path.join(BASE_PATH, 'Paintings & Prints', 'Classical'), 'Paintings & Prints/Classical');
    await processCategory(path.join(BASE_PATH, 'Toran'), 'Toran');
    await processCategory(path.join(BASE_PATH, 'Wall Decor'), 'Wall Decor');
    
    // Get final count
    const productsSnapshot = await db.collection('products').get();
    console.log(`\n🎉 Product creation complete!`);
    console.log(`📊 Total products in database: ${productsSnapshot.size}`);
    
    // Show category breakdown
    const categoryBreakdown = {};
    productsSnapshot.forEach(doc => {
      const product = doc.data();
      const category = product.categories[0];
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });
    
    console.log('\n📋 Products by category:');
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} products`);
    });
    
  } catch (error) {
    console.error('❌ Error creating products:', error);
  }
}

// Run the script
createProducts();