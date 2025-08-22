const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// Initialize Firebase Admin SDK
initializeApp({
  projectId: 'tripund-ecommerce-1755860933',
});

const db = getFirestore();

const BASE_PATH = '/Users/sumitjha/Dropbox/Mac/Documents/Projects/tripund-ecommerce/Category and Product Images';

// Function to extract text from docx files
async function extractTextFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.trim();
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Function to parse product description structure
function parseProductDescription(text) {
  if (!text) return null;
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const description = {
    title: '',
    features: [],
    specifications: {},
    materials: [],
    care_instructions: [],
    dimensions: '',
    weight: '',
    origin: '',
    story: '',
    full_text: text
  };
  
  let currentSection = 'general';
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip common headers
    if (lowerLine.includes('product details') || lowerLine.includes('description')) {
      continue;
    }
    
    // Detect sections
    if (lowerLine.includes('features') || lowerLine.includes('highlights')) {
      currentSection = 'features';
      continue;
    }
    if (lowerLine.includes('specification') || lowerLine.includes('dimensions') || lowerLine.includes('size')) {
      currentSection = 'specifications';
      continue;
    }
    if (lowerLine.includes('material') || lowerLine.includes('made of')) {
      currentSection = 'materials';
      continue;
    }
    if (lowerLine.includes('care') || lowerLine.includes('maintenance')) {
      currentSection = 'care';
      continue;
    }
    if (lowerLine.includes('story') || lowerLine.includes('artisan') || lowerLine.includes('heritage')) {
      currentSection = 'story';
      continue;
    }
    
    // Extract specific information
    if (lowerLine.includes('weight:') || lowerLine.includes('wt:')) {
      description.weight = line.split(':')[1]?.trim() || '';
    } else if (lowerLine.includes('size:') || lowerLine.includes('dimensions:')) {
      description.dimensions = line.split(':')[1]?.trim() || '';
    } else if (lowerLine.includes('origin:') || lowerLine.includes('made in:')) {
      description.origin = line.split(':')[1]?.trim() || '';
    } else if (currentSection === 'features' && line.length > 10) {
      description.features.push(line);
    } else if (currentSection === 'materials' && line.length > 5) {
      description.materials.push(line);
    } else if (currentSection === 'care' && line.length > 10) {
      description.care_instructions.push(line);
    } else if (currentSection === 'story' && line.length > 20) {
      description.story += (description.story ? ' ' : '') + line;
    } else if (currentSection === 'specifications') {
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          description.specifications[key] = value;
        }
      }
    } else if (currentSection === 'general' && !description.title && line.length > 10 && line.length < 100) {
      description.title = line;
    }
  }
  
  return description;
}

// Function to process products and update with descriptions
async function processProductDescriptions() {
  console.log('📄 Parsing product descriptions from documents...\n');
  
  const categoryPaths = [
    'Figurines',
    'Idols',
    'Paintings & Prints/Bold',
    'Paintings & Prints/Classical', 
    'Toran',
    'Wall Decor'
  ];
  
  let processed = 0;
  let updated = 0;
  
  for (const categoryPath of categoryPaths) {
    const fullCategoryPath = path.join(BASE_PATH, categoryPath);
    
    if (!fs.existsSync(fullCategoryPath)) {
      console.log(`⚠️  Category path not found: ${categoryPath}`);
      continue;
    }
    
    console.log(`📁 Processing category: ${categoryPath}`);
    
    const productDirs = fs.readdirSync(fullCategoryPath)
      .filter(item => fs.statSync(path.join(fullCategoryPath, item)).isDirectory());
    
    for (const productDir of productDirs) {
      const fullProductPath = path.join(fullCategoryPath, productDir);
      const productSku = productDir.split('-')[0];
      
      // Find .docx files in the product directory
      const files = fs.readdirSync(fullProductPath);
      const docxFiles = files.filter(file => path.extname(file).toLowerCase() === '.docx');
      
      if (docxFiles.length === 0) {
        console.log(`  ⚠️  No .docx files found for ${productSku}`);
        continue;
      }
      
      // Process the first .docx file found
      const docxFile = docxFiles[0];
      const docxPath = path.join(fullProductPath, docxFile);
      
      console.log(`  📄 Processing: ${productSku} - ${docxFile}`);
      processed++;
      
      try {
        // Extract text from document
        const text = await extractTextFromDocx(docxPath);
        if (!text) {
          console.log(`    ❌ Could not extract text from ${docxFile}`);
          continue;
        }
        
        // Parse the description
        const parsedDescription = parseProductDescription(text);
        if (!parsedDescription) {
          console.log(`    ❌ Could not parse description for ${productSku}`);
          continue;
        }
        
        // Find the product in Firestore by SKU
        const productQuery = await db.collection('products').where('sku', '==', productSku).get();
        
        if (productQuery.empty) {
          console.log(`    ⚠️  Product not found in database: ${productSku}`);
          continue;
        }
        
        // Update the product with parsed description
        const productDoc = productQuery.docs[0];
        const updateData = {
          parsed_description: parsedDescription,
          description: parsedDescription.title || parsedDescription.story || text.substring(0, 200) + '...',
          short_description: parsedDescription.features.length > 0 ? parsedDescription.features[0] : text.substring(0, 150) + '...',
          updated_at: new Date()
        };
        
        // Add materials to attributes if found
        if (parsedDescription.materials.length > 0) {
          const currentData = productDoc.data();
          const attributes = currentData.attributes || [];
          
          // Add materials to attributes
          parsedDescription.materials.forEach(material => {
            attributes.push({
              name: 'Material',
              value: material
            });
          });
          
          updateData.attributes = attributes;
        }
        
        // Add specifications to attributes
        if (Object.keys(parsedDescription.specifications).length > 0) {
          const currentData = productDoc.data();
          const attributes = currentData.attributes || [];
          
          Object.entries(parsedDescription.specifications).forEach(([key, value]) => {
            attributes.push({
              name: key,
              value: value
            });
          });
          
          updateData.attributes = attributes;
        }
        
        await productDoc.ref.update(updateData);
        updated++;
        
        console.log(`    ✅ Updated: ${productSku}`);
        console.log(`       Title: ${parsedDescription.title || 'N/A'}`);
        console.log(`       Features: ${parsedDescription.features.length}`);
        console.log(`       Materials: ${parsedDescription.materials.length}`);
        console.log(`       Specifications: ${Object.keys(parsedDescription.specifications).length}`);
        
      } catch (error) {
        console.error(`    ❌ Error processing ${productSku}:`, error.message);
      }
    }
  }
  
  console.log(`\n🎉 Description parsing complete!`);
  console.log(`📊 Processed: ${processed} documents`);
  console.log(`✅ Updated: ${updated} products`);
}

processProductDescriptions().catch(console.error);