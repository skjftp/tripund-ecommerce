const admin = require('firebase-admin');

// Initialize Firebase Admin with default credentials
admin.initializeApp({
  projectId: 'tripund-ecommerce-1755860933'
});

const db = admin.firestore();

const elegantOrderTemplate = {
  id: 'elegant-order-confirmation',
  name: 'Elegant Order Confirmation',
  subject: 'Tripund Lifestyle Order No. {{OrderNumber}}',
  type: 'order_confirmation',
  category: 'transactional',
  is_active: true,
  is_default: true, // Set as default
  preview: 'Modern, elegant order confirmation email with complete order details',
  variables: [
    {key: 'CustomerName', label: 'Customer Name', type: 'string', required: true, example: 'John Doe', description: 'Full name of the customer'},
    {key: 'OrderNumber', label: 'Order Number', type: 'string', required: true, example: 'TL-2025-001234', description: 'Unique order identifier'},
    {key: 'OrderDate', label: 'Order Date', type: 'string', required: true, example: 'January 15, 2025', description: 'Date when order was placed'},
    {key: 'ExpectedDelivery', label: 'Expected Delivery', type: 'string', required: true, example: 'Monday, January 22, 2025', description: 'Expected delivery date'},
    {key: 'PaymentMethod', label: 'Payment Method', type: 'string', required: true, example: 'Prepaid', description: 'Payment method used'},
    {key: 'DeliverySpeed', label: 'Delivery Speed', type: 'string', required: true, example: 'Standard', description: 'Shipping speed selected'},
    {key: 'OrderStatusLink', label: 'Order Status Link', type: 'string', required: true, example: 'https://tripundlifestyle.com/track-order/TL-2025-001234', description: 'Link to track order'},
    {key: 'Items', label: 'Order Items', type: 'array', required: true, description: 'Array of ordered items with image, description, qty, price'},
    {key: 'DeliveryAddress', label: 'Delivery Address', type: 'object', required: true, description: 'Customer delivery address'},
    {key: 'BillingAddress', label: 'Billing Address', type: 'object', required: true, description: 'Customer billing address'},
    {key: 'Subtotal', label: 'Subtotal', type: 'number', required: true, example: '2999.00', description: 'Order subtotal amount'},
    {key: 'DeliveryCharge', label: 'Delivery Charge', type: 'number', required: true, example: '0.00', description: 'Delivery charges'},
    {key: 'TaxAmount', label: 'GST/IGST', type: 'number', required: true, example: '539.82', description: 'Tax amount'},
    {key: 'TotalAmount', label: 'Total Amount', type: 'number', required: true, example: '3538.82', description: 'Final total amount'},
    {key: 'ContactPhone', label: 'Contact Phone', type: 'string', required: true, example: '+91 9711441830', description: 'Customer support phone'},
    {key: 'ContactWhatsApp', label: 'WhatsApp Link', type: 'string', required: true, example: 'https://wa.me/919711441830', description: 'WhatsApp support link'}
  ],
  html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - {{OrderNumber}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #f8f9fa; 
            color: #333;
            line-height: 1.6;
        }
        .email-container { 
            max-width: 650px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1); 
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); 
            color: white; 
            padding: 30px 40px; 
            text-align: center; 
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            letter-spacing: 2px; 
            margin-bottom: 10px; 
        }
        .header-subtitle { 
            opacity: 0.9; 
            font-size: 16px; 
        }
        .content { 
            padding: 40px; 
        }
        .greeting { 
            font-size: 22px; 
            color: #2d3748; 
            margin-bottom: 20px; 
            font-weight: 600; 
        }
        .thank-you { 
            color: #4a5568; 
            margin-bottom: 30px; 
            font-size: 16px; 
        }
        .status-link { 
            display: inline-block; 
            background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 25px; 
            font-weight: 600; 
            margin: 20px 0; 
            transition: transform 0.2s;
        }
        .status-link:hover { transform: translateY(-2px); }
        .delivery-info { 
            background: #f7fafc; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #8B4513; 
            margin: 25px 0; 
        }
        .delivery-date { 
            font-size: 18px; 
            font-weight: 600; 
            color: #8B4513; 
        }
        .order-details-box { 
            background: #f8f9fa; 
            padding: 25px; 
            border-radius: 10px; 
            margin: 30px 0; 
        }
        .order-details-title { 
            font-size: 20px; 
            font-weight: 600; 
            color: #2d3748; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #8B4513; 
            padding-bottom: 10px; 
        }
        .detail-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
        }
        .detail-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px 0; 
            border-bottom: 1px solid #e2e8f0; 
        }
        .detail-label { 
            font-weight: 600; 
            color: #4a5568; 
        }
        .detail-value { 
            color: #2d3748; 
            text-align: right; 
        }
        .addresses-container { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin: 30px 0; 
        }
        .address-box { 
            background: white; 
            border: 2px solid #e2e8f0; 
            padding: 20px; 
            border-radius: 10px; 
        }
        .address-title { 
            font-weight: 600; 
            color: #2d3748; 
            margin-bottom: 10px; 
            font-size: 16px; 
        }
        .address-content { 
            color: #4a5568; 
            font-size: 14px; 
        }
        .items-section { 
            margin: 30px 0; 
        }
        .section-title { 
            font-size: 20px; 
            font-weight: 600; 
            color: #2d3748; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #8B4513; 
            padding-bottom: 10px; 
        }
        .item { 
            display: flex; 
            align-items: center; 
            padding: 20px; 
            border: 2px solid #f1f5f9; 
            border-radius: 10px; 
            margin-bottom: 15px; 
            background: white; 
        }
        .item-image { 
            width: 80px; 
            height: 80px; 
            background: #f8f9fa; 
            border-radius: 8px; 
            margin-right: 20px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #8B4513; 
            font-weight: bold; 
        }
        .item-details { 
            flex-grow: 1; 
        }
        .item-name { 
            font-weight: 600; 
            color: #2d3748; 
            margin-bottom: 5px; 
        }
        .item-variant { 
            color: #718096; 
            font-size: 14px; 
        }
        .item-price-section { 
            text-align: right; 
        }
        .item-qty { 
            color: #4a5568; 
            margin-bottom: 5px; 
        }
        .item-price { 
            font-size: 18px; 
            font-weight: 600; 
            color: #8B4513; 
        }
        .summary-box { 
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%); 
            color: white; 
            padding: 25px; 
            border-radius: 10px; 
            margin: 30px 0; 
        }
        .summary-title { 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 20px; 
            text-align: center; 
        }
        .summary-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px 0; 
            border-bottom: 1px solid rgba(255,255,255,0.2); 
        }
        .summary-row:last-child { 
            border-bottom: none; 
        }
        .total-row { 
            font-size: 20px; 
            font-weight: bold; 
            padding-top: 15px; 
            border-top: 2px solid rgba(255,255,255,0.3); 
            margin-top: 15px; 
        }
        .footer { 
            background: #2d3748; 
            color: white; 
            padding: 30px 40px; 
            text-align: center; 
        }
        .footer-title { 
            font-size: 18px; 
            margin-bottom: 15px; 
        }
        .contact-links { 
            display: flex; 
            justify-content: center; 
            gap: 20px; 
            margin-bottom: 20px; 
        }
        .contact-link { 
            color: #D2691E; 
            text-decoration: none; 
            font-weight: 600; 
            padding: 8px 16px; 
            border: 2px solid #D2691E; 
            border-radius: 20px; 
            transition: all 0.3s; 
        }
        .contact-link:hover { 
            background: #D2691E; 
            color: white; 
        }
        .footer-note { 
            font-size: 14px; 
            opacity: 0.8; 
            margin-top: 20px; 
        }
        @media (max-width: 768px) {
            .content { padding: 20px; }
            .detail-grid { grid-template-columns: 1fr; }
            .addresses-container { grid-template-columns: 1fr; }
            .contact-links { flex-direction: column; align-items: center; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">TRIPUND LIFESTYLE</div>
            <div class="header-subtitle">Authentic Handcrafted Treasures</div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <div class="greeting">Dear {{CustomerName}},</div>
            
            <div class="thank-you">
                Thank you for your order, we're processing it now and we will let you know when it's on its way.
            </div>
            
            <a href="{{OrderStatusLink}}" class="status-link">📦 Check Order Status</a>
            
            <div class="delivery-info">
                <div class="delivery-date">Expected Delivery: {{ExpectedDelivery}}</div>
            </div>
            
            <!-- Order Details -->
            <div class="order-details-box">
                <div class="order-details-title">Order Details</div>
                <div class="detail-grid">
                    <div>
                        <div class="detail-item">
                            <span class="detail-label">Order Number</span>
                            <span class="detail-value">{{OrderNumber}}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Order Date</span>
                            <span class="detail-value">{{OrderDate}}</span>
                        </div>
                    </div>
                    <div>
                        <div class="detail-item">
                            <span class="detail-label">Payment</span>
                            <span class="detail-value">{{PaymentMethod}}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Speed</span>
                            <span class="detail-value">{{DeliverySpeed}}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Addresses -->
            <div class="addresses-container">
                <div class="address-box">
                    <div class="address-title">📍 Delivery Address</div>
                    <div class="address-content">
                        {{CustomerName}}<br>
                        {{DeliveryAddress.Street}}<br>
                        {{DeliveryAddress.City}}, {{DeliveryAddress.State}}<br>
                        {{DeliveryAddress.Pincode}}<br>
                        {{DeliveryAddress.Country}}
                    </div>
                </div>
                <div class="address-box">
                    <div class="address-title">💳 Billing Address</div>
                    <div class="address-content">
                        {{CustomerName}}<br>
                        {{BillingAddress.Street}}<br>
                        {{BillingAddress.City}}, {{BillingAddress.State}}<br>
                        {{BillingAddress.Pincode}}<br>
                        {{BillingAddress.Country}}
                    </div>
                </div>
            </div>
            
            <!-- Items -->
            <div class="items-section">
                <div class="section-title">Item Details</div>
                {{range .Items}}
                <div class="item">
                    <div class="item-image">
                        {{if .Image}}
                            <img src="{{.Image}}" alt="{{.Name}}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">
                        {{else}}
                            📦
                        {{end}}
                    </div>
                    <div class="item-details">
                        <div class="item-name">{{.Name}}</div>
                        <div class="item-variant">
                            {{if .Color}}Color: {{.Color}}{{end}}
                            {{if .Size}}{{if .Color}}, {{end}}Size: {{.Size}}{{end}}
                        </div>
                    </div>
                    <div class="item-price-section">
                        <div class="item-qty">Qty: {{.Quantity}}</div>
                        <div class="item-price">₹{{.TotalPrice}}</div>
                    </div>
                </div>
                {{end}}
            </div>
            
            <!-- Order Summary -->
            <div class="summary-box">
                <div class="summary-title">💰 Order Summary</div>
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>₹{{Subtotal}}</span>
                </div>
                <div class="summary-row">
                    <span>Delivery: {{DeliverySpeed}}</span>
                    <span>₹{{DeliveryCharge}}</span>
                </div>
                <div class="summary-row">
                    <span>GST/IGST</span>
                    <span>₹{{TaxAmount}}</span>
                </div>
                <div class="summary-row total-row">
                    <span>Total</span>
                    <span>₹{{TotalAmount}}</span>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-title">Have Questions? Just ask</div>
            <div class="contact-links">
                <a href="tel:{{ContactPhone}}" class="contact-link">📞 Call Us</a>
                <a href="{{ContactWhatsApp}}" class="contact-link">💬 WhatsApp</a>
            </div>
            <div class="footer-note">
                Thank you for choosing TRIPUND Lifestyle for your handcrafted needs.<br>
                We appreciate your business and look forward to serving you again.
            </div>
        </div>
    </div>
</body>
</html>`,
  created_at: admin.firestore.Timestamp.now(),
  updated_at: admin.firestore.Timestamp.now(),
  metadata: {
    version: '2.0',
    author: 'TRIPUND Team',
    description: 'Complete order confirmation template with all order details, addresses, and professional styling'
  }
};

async function updateEmailTemplate() {
  try {
    console.log('🚀 Creating/updating elegant order confirmation email template...');

    // First, set all existing order confirmation templates to non-default
    const existingTemplates = await db.collection('email_templates')
      .where('type', '==', 'order_confirmation')
      .where('is_default', '==', true)
      .get();
    
    const batch = db.batch();
    existingTemplates.forEach(doc => {
      batch.update(doc.ref, { is_default: false });
    });
    await batch.commit();
    console.log('✅ Updated existing templates to non-default');

    // Create/update the new template
    await db.collection('email_templates').doc(elegantOrderTemplate.id).set(elegantOrderTemplate);
    console.log('✅ Successfully created elegant order confirmation template');
    console.log('📧 Template ID:', elegantOrderTemplate.id);
    console.log('📧 Subject:', elegantOrderTemplate.subject);
    console.log('🎯 Set as default template for order confirmations');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating email template:', error);
    process.exit(1);
  }
}

updateEmailTemplate();