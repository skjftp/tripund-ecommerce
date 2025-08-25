const { Firestore } = require('@google-cloud/firestore');

// Initialize Firestore
const db = new Firestore({
  projectId: 'tripund-ecommerce-1755860933',
});

async function generateInvoicesForExistingOrders() {
  try {
    console.log('🔍 Fetching completed orders without invoices...');
    
    // Get all completed orders
    const ordersSnapshot = await db.collection('orders')
      .where('status', '==', 'completed')
      .get();
    
    if (ordersSnapshot.empty) {
      console.log('ℹ️ No completed orders found.');
      return;
    }
    
    console.log(`📦 Found ${ordersSnapshot.size} completed orders.`);
    
    // Get all existing invoices to check which orders already have invoices
    const invoicesSnapshot = await db.collection('invoices').get();
    const existingOrderIds = new Set();
    
    invoicesSnapshot.forEach(doc => {
      const invoice = doc.data();
      if (invoice.order_id) {
        existingOrderIds.add(invoice.order_id);
      }
    });
    
    console.log(`📋 Found ${existingOrderIds.size} orders that already have invoices.`);
    
    // Get company settings for invoice generation
    const settingsDoc = await db.collection('settings').doc('company').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    
    const ordersWithoutInvoices = [];
    
    ordersSnapshot.forEach(doc => {
      if (!existingOrderIds.has(doc.id)) {
        ordersWithoutInvoices.push({
          id: doc.id,
          data: doc.data()
        });
      }
    });
    
    console.log(`🎯 Found ${ordersWithoutInvoices.length} orders that need invoices.`);
    
    if (ordersWithoutInvoices.length === 0) {
      console.log('✅ All completed orders already have invoices!');
      return;
    }
    
    let generatedCount = 0;
    const batch = db.batch();
    
    for (const order of ordersWithoutInvoices) {
      try {
        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber();
        
        // Create invoice from order
        const invoice = createInvoiceFromOrder(order, settings, invoiceNumber);
        
        // Add to batch
        const invoiceRef = db.collection('invoices').doc();
        batch.set(invoiceRef, invoice);
        
        // Update order with invoice ID
        const orderRef = db.collection('orders').doc(order.id);
        batch.update(orderRef, {
          invoice_id: invoiceRef.id,
          updated_at: new Date()
        });
        
        generatedCount++;
        console.log(`📄 Prepared invoice ${invoiceNumber} for order ${order.id}`);
        
        // Commit batch in chunks of 500 (Firestore limit)
        if (generatedCount % 500 === 0) {
          await batch.commit();
          console.log(`💾 Committed batch of ${generatedCount} invoices.`);
        }
        
      } catch (error) {
        console.error(`❌ Error preparing invoice for order ${order.id}:`, error.message);
      }
    }
    
    // Commit remaining invoices
    if (generatedCount % 500 !== 0) {
      await batch.commit();
    }
    
    console.log(`🎉 Successfully generated ${generatedCount} invoices for existing orders!`);
    
  } catch (error) {
    console.error('❌ Error generating invoices:', error);
  }
}

async function generateInvoiceNumber() {
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7).replace('-', ''); // YYYYMM format
  const prefix = `TRIPUND-${yearMonth}-`;
  
  // Get last invoice number for current month
  const invoicesSnapshot = await db.collection('invoices')
    .where('invoice_number', '>=', prefix)
    .where('invoice_number', '<', prefix + 'Z')
    .orderBy('invoice_number', 'desc')
    .limit(1)
    .get();
  
  let lastNumber = 0;
  if (!invoicesSnapshot.empty) {
    const lastInvoice = invoicesSnapshot.docs[0].data();
    const numberStr = lastInvoice.invoice_number.substring(prefix.length);
    lastNumber = parseInt(numberStr) || 0;
  }
  
  const newNumber = lastNumber + 1;
  return `${prefix}${newNumber.toString().padStart(4, '0')}`;
}

function createInvoiceFromOrder(order, settings, invoiceNumber) {
  const now = new Date();
  const dueDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
  
  // Extract invoice settings
  const invoiceSettings = settings.invoice || {};
  
  // Create seller address
  const sellerAddress = {
    line1: invoiceSettings.address_line1 || 'TRIPUND LIFESTYLE PRIVATE LIMITED',
    line2: invoiceSettings.address_line2 || '',
    city: invoiceSettings.city || 'Mumbai',
    state: invoiceSettings.home_state || 'Maharashtra',
    state_code: invoiceSettings.home_state_code || '27',
    postal_code: invoiceSettings.postal_code || '400001',
    country: 'India'
  };
  
  // Create buyer details
  const buyerAddress = {
    line1: order.data.shipping_address?.line1 || '',
    line2: order.data.shipping_address?.line2 || '',
    city: order.data.shipping_address?.city || '',
    state: order.data.shipping_address?.state || '',
    state_code: getStateCode(order.data.shipping_address?.state || ''),
    postal_code: order.data.shipping_address?.postal_code || '',
    country: order.data.shipping_address?.country || 'India'
  };
  
  const buyerDetails = {
    name: `${order.data.shipping_address?.first_name || ''} ${order.data.shipping_address?.last_name || ''}`.trim(),
    email: order.data.user_email || '',
    phone: order.data.shipping_address?.phone_number || '',
    address: buyerAddress,
    is_b2b: false
  };
  
  // Create bank details
  const bankDetails = {
    account_name: invoiceSettings.bank_account_name || 'TRIPUND LIFESTYLE PRIVATE LIMITED',
    account_number: invoiceSettings.bank_account_number || '',
    ifsc_code: invoiceSettings.bank_ifsc || '',
    bank_name: invoiceSettings.bank_name || '',
    branch_name: invoiceSettings.bank_branch || ''
  };
  
  // Create line items
  const lineItems = [];
  const gstRate = 18.0; // Default GST rate
  const isInterState = sellerAddress.state_code !== buyerAddress.state_code;
  
  if (order.data.items && Array.isArray(order.data.items)) {
    order.data.items.forEach((item, index) => {
      const taxableValue = item.price * item.quantity;
      
      const lineItem = {
        id: `item_${index + 1}`,
        product_id: item.product_id || '',
        product_name: item.name || '',
        hsn_code: '9403', // Default HSN code for handicrafts
        quantity: item.quantity,
        unit_price: item.price,
        taxable_value: taxableValue,
        cgst_rate: isInterState ? 0 : gstRate / 2,
        cgst_amount: isInterState ? 0 : (taxableValue * gstRate / 2) / 100,
        sgst_rate: isInterState ? 0 : gstRate / 2,
        sgst_amount: isInterState ? 0 : (taxableValue * gstRate / 2) / 100,
        igst_rate: isInterState ? gstRate : 0,
        igst_amount: isInterState ? (taxableValue * gstRate) / 100 : 0,
        total_amount: 0 // Will be calculated below
      };
      
      lineItem.total_amount = lineItem.taxable_value + lineItem.cgst_amount + lineItem.sgst_amount + lineItem.igst_amount;
      lineItems.push(lineItem);
    });
  }
  
  // Calculate tax summary
  const taxSummary = calculateTaxSummary(lineItems);
  
  const invoice = {
    invoice_number: invoiceNumber,
    order_id: order.id,
    user_id: order.data.user_id || '',
    type: 'regular',
    status: 'sent',
    
    // Seller details
    seller_name: invoiceSettings.registered_name || 'TRIPUND LIFESTYLE PRIVATE LIMITED',
    seller_gstin: invoiceSettings.gstin || '',
    seller_pan: invoiceSettings.pan || '',
    seller_address: sellerAddress,
    seller_email: invoiceSettings.email || 'orders@tripundlifestyle.com',
    seller_phone: invoiceSettings.phone || '+91 9876543210',
    
    // Buyer details
    buyer_details: buyerDetails,
    shipping_address: buyerAddress,
    
    // Invoice details
    issue_date: now,
    due_date: dueDate,
    place_of_supply: buyerAddress.state,
    place_of_delivery: buyerAddress.state,
    
    // Line items
    line_items: lineItems,
    
    // Tax summary
    tax_summary: taxSummary,
    
    // Payment info
    bank_details: bankDetails,
    payment_terms: 'Payment due within 30 days',
    
    // Additional fields
    notes: 'Thank you for your business!',
    terms_conditions: invoiceSettings.terms_conditions || 'Standard terms and conditions apply.',
    
    // System fields
    created_at: now,
    updated_at: now,
    created_by: 'system'
  };
  
  return invoice;
}

function calculateTaxSummary(lineItems) {
  let totalTaxableValue = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalDiscount = 0;
  
  lineItems.forEach(item => {
    totalTaxableValue += item.taxable_value;
    totalCGST += item.cgst_amount;
    totalSGST += item.sgst_amount;
    totalIGST += item.igst_amount;
    totalDiscount += item.discount || 0;
  });
  
  const totalTax = totalCGST + totalSGST + totalIGST;
  const grandTotal = totalTaxableValue + totalTax;
  
  // Round to nearest rupee
  const finalAmount = Math.round(grandTotal);
  const roundingAmount = finalAmount - grandTotal;
  
  return {
    total_taxable_value: totalTaxableValue,
    total_cgst: totalCGST,
    total_sgst: totalSGST,
    total_igst: totalIGST,
    total_tax: totalTax,
    total_discount: totalDiscount,
    grand_total: grandTotal,
    rounding_amount: roundingAmount,
    final_amount: finalAmount
  };
}

function getStateCode(state) {
  const stateCodes = {
    'Andhra Pradesh': '37',
    'Arunachal Pradesh': '12',
    'Assam': '18',
    'Bihar': '10',
    'Chhattisgarh': '22',
    'Goa': '30',
    'Gujarat': '24',
    'Haryana': '06',
    'Himachal Pradesh': '02',
    'Jharkhand': '20',
    'Karnataka': '29',
    'Kerala': '32',
    'Madhya Pradesh': '23',
    'Maharashtra': '27',
    'Manipur': '14',
    'Meghalaya': '17',
    'Mizoram': '15',
    'Nagaland': '13',
    'Odisha': '21',
    'Punjab': '03',
    'Rajasthan': '08',
    'Sikkim': '11',
    'Tamil Nadu': '33',
    'Telangana': '36',
    'Tripura': '16',
    'Uttar Pradesh': '09',
    'Uttarakhand': '05',
    'West Bengal': '19',
    'Delhi': '07',
    'Jammu and Kashmir': '01',
    'Ladakh': '38',
    'Chandigarh': '04',
    'Dadra and Nagar Haveli and Daman and Diu': '26',
    'Lakshadweep': '31',
    'Puducherry': '34',
    'Andaman and Nicobar Islands': '35'
  };
  
  return stateCodes[state] || '99'; // Default unknown state code
}

// Run the script
if (require.main === module) {
  generateInvoicesForExistingOrders()
    .then(() => {
      console.log('✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateInvoicesForExistingOrders };