const admin = require('firebase-admin');

// Initialize Firebase Admin with default credentials
admin.initializeApp({
  projectId: 'tripund-ecommerce-1755860933'
});

const db = admin.firestore();

// Template data
const templates = [
  {
    id: 'elegant-order-template',
    name: 'Elegant Order Confirmation',
    subject: 'Order Confirmation - {{.OrderNumber}} | TRIPUND Lifestyle',
    type: 'order_confirmation',
    category: 'transactional',
    is_active: true,
    is_default: false,
    variables: [
      {key: 'CustomerName', label: 'Customer Name', type: 'string', required: true, example: 'John Doe'},
      {key: 'CustomerEmail', label: 'Customer Email', type: 'string', required: true, example: 'customer@email.com'},
      {key: 'OrderNumber', label: 'Order Number', type: 'string', required: true, example: 'ORD-2025-123456'},
      {key: 'OrderDate', label: 'Order Date', type: 'date', required: true, example: 'January 2, 2025'},
      {key: 'Items', label: 'Order Items', type: 'array', required: true, description: 'Array of ordered items'},
      {key: 'Subtotal', label: 'Subtotal', type: 'number', required: true, example: '9999.00'},
      {key: 'Shipping', label: 'Shipping Cost', type: 'number', required: true, example: '100.00'},
      {key: 'Tax', label: 'Tax Amount', type: 'number', required: true, example: '1800.00'},
      {key: 'Total', label: 'Total Amount', type: 'number', required: true, example: '11899.00'},
      {key: 'ShippingAddress', label: 'Shipping Address', type: 'object', required: true}
    ],
    html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
        .header { background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 2px; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 40px; }
        .greeting { font-size: 24px; color: #333; margin-bottom: 20px; }
        .order-box { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 15px; margin: 30px 0; }
        .order-box h3 { margin: 0 0 15px; color: #4a5568; }
        .order-detail { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.5); }
        .order-detail:last-child { border-bottom: none; }
        .items-container { margin: 30px 0; }
        .item-card { background: white; border-radius: 12px; padding: 20px; margin: 15px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; }
        .item-image { width: 80px; height: 80px; background: #f7fafc; border-radius: 8px; margin-right: 20px; }
        .item-details { flex-grow: 1; }
        .item-name { font-weight: 600; color: #2d3748; margin-bottom: 5px; }
        .item-variant { color: #718096; font-size: 14px; }
        .item-price { text-align: right; }
        .price-amount { font-size: 20px; font-weight: 600; color: #8B4513; }
        .total-section { background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 30px; border-radius: 15px; margin: 30px 0; }
        .total-row { display: flex; justify-content: space-between; margin: 12px 0; font-size: 16px; }
        .total-row.final { font-size: 24px; font-weight: bold; padding-top: 15px; border-top: 2px solid rgba(255,255,255,0.3); margin-top: 20px; }
        .address-box { background: #f8f9fa; padding: 25px; border-radius: 12px; border-left: 4px solid #8B4513; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; margin: 20px 0; font-weight: 600; box-shadow: 0 10px 20px rgba(139,69,19,0.3); }
        .footer { background: #2d3748; color: white; padding: 30px; text-align: center; }
        .social-links { margin: 20px 0; }
        .social-links a { color: white; text-decoration: none; margin: 0 15px; font-size: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ ORDER CONFIRMED</h1>
            <p>Thank you for choosing TRIPUND Lifestyle</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{.CustomerName}},
            </div>
            
            <p style="font-size: 18px; color: #4a5568; line-height: 1.8;">
                Your order has been confirmed and our artisans are already preparing your handcrafted treasures with love and care!
            </p>
            
            <div class="order-box">
                <h3>📦 Order Information</h3>
                <div class="order-detail">
                    <span>Order Number:</span>
                    <strong>{{.OrderNumber}}</strong>
                </div>
                <div class="order-detail">
                    <span>Order Date:</span>
                    <strong>{{.OrderDate}}</strong>
                </div>
                <div class="order-detail">
                    <span>Email:</span>
                    <strong>{{.CustomerEmail}}</strong>
                </div>
            </div>
            
            <div class="items-container">
                <h3 style="color: #2d3748; font-size: 22px;">Your Items</h3>
                {{range .Items}}
                <div class="item-card">
                    <div class="item-image"></div>
                    <div class="item-details">
                        <div class="item-name">{{.ProductName}}</div>
                        {{if or .VariantColor .VariantSize}}
                        <div class="item-variant">
                            {{if .VariantColor}}Color: {{.VariantColor}}{{end}}
                            {{if and .VariantColor .VariantSize}} • {{end}}
                            {{if .VariantSize}}Size: {{.VariantSize}}{{end}}
                        </div>
                        {{end}}
                        <div style="margin-top: 10px; color: #718096;">
                            Qty: {{.Quantity}} × ₹{{printf "%.2f" .Price}}
                        </div>
                    </div>
                    <div class="item-price">
                        <div class="price-amount">₹{{printf "%.2f" .Total}}</div>
                    </div>
                </div>
                {{end}}
            </div>
            
            <div class="total-section">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>₹{{printf "%.2f" .Subtotal}}</span>
                </div>
                <div class="total-row">
                    <span>Shipping</span>
                    <span>₹{{printf "%.2f" .Shipping}}</span>
                </div>
                <div class="total-row">
                    <span>Tax</span>
                    <span>₹{{printf "%.2f" .Tax}}</span>
                </div>
                <div class="total-row final">
                    <span>Total</span>
                    <span>₹{{printf "%.2f" .Total}}</span>
                </div>
            </div>
            
            <div class="address-box">
                <h3 style="margin: 0 0 15px; color: #2d3748;">📍 Delivery Address</h3>
                <p style="line-height: 1.8; color: #4a5568;">
                    {{.ShippingAddress.Line1}}<br>
                    {{if .ShippingAddress.Line2}}{{.ShippingAddress.Line2}}<br>{{end}}
                    {{.ShippingAddress.City}}, {{.ShippingAddress.State}} {{.ShippingAddress.PostalCode}}<br>
                    {{.ShippingAddress.Country}}
                </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="https://tripundlifestyle.com/orders/{{.OrderNumber}}" class="cta-button">
                    TRACK YOUR ORDER
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0; font-size: 18px;">TRIPUND Lifestyle</p>
            <p style="margin: 10px 0; opacity: 0.8;">Premium Indian Handicrafts & Home Décor</p>
            <div class="social-links">
                <a href="#">📧</a>
                <a href="#">📘</a>
                <a href="#">📷</a>
            </div>
            <p style="margin: 20px 0 0; font-size: 14px; opacity: 0.7;">
                © 2025 TRIPUND Lifestyle. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`
  },
  {
    id: 'minimal-order-template',
    name: 'Minimal Order Confirmation',
    subject: 'Your Order {{.OrderNumber}} is Confirmed',
    type: 'order_confirmation',
    category: 'transactional',
    is_active: true,
    is_default: false,
    variables: [
      {key: 'CustomerName', label: 'Customer Name', type: 'string', required: true, example: 'John Doe'},
      {key: 'OrderNumber', label: 'Order Number', type: 'string', required: true, example: 'ORD-2025-123456'},
      {key: 'OrderDate', label: 'Order Date', type: 'date', required: true, example: 'January 2, 2025'},
      {key: 'Items', label: 'Order Items', type: 'array', required: true},
      {key: 'Subtotal', label: 'Subtotal', type: 'number', required: true, example: '9999.00'},
      {key: 'Shipping', label: 'Shipping Cost', type: 'number', required: true, example: '100.00'},
      {key: 'Tax', label: 'Tax Amount', type: 'number', required: true, example: '1800.00'},
      {key: 'Total', label: 'Total Amount', type: 'number', required: true, example: '11899.00'},
      {key: 'ShippingAddress', label: 'Shipping Address', type: 'object', required: true}
    ],
    html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111; margin: 0; padding: 20px; background: #fff; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { font-size: 24px; font-weight: 400; margin: 0; }
        .subtitle { color: #666; margin-top: 5px; }
        .section { margin: 30px 0; }
        .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 12px 0; border-bottom: 1px solid #eee; }
        .text-right { text-align: right; }
        .strong { font-weight: 600; }
        .total-row td { border-bottom: 2px solid #111; border-top: 2px solid #111; padding: 20px 0; font-size: 18px; font-weight: 600; }
        .address { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .footer { margin-top: 50px; padding-top: 30px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ORDER CONFIRMATION</h1>
            <div class="subtitle">{{.OrderNumber}}</div>
        </div>
        
        <div class="section">
            <p>Hello {{.CustomerName}},</p>
            <p>Thank you for your order. We've received it and will begin processing shortly.</p>
        </div>
        
        <div class="section">
            <div class="section-title">Order Details</div>
            <table>
                <tr>
                    <td>Order Date</td>
                    <td class="text-right">{{.OrderDate}}</td>
                </tr>
                <tr>
                    <td>Order Number</td>
                    <td class="text-right">{{.OrderNumber}}</td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <div class="section-title">Items Ordered</div>
            <table>
                {{range .Items}}
                <tr>
                    <td>
                        {{.ProductName}}<br>
                        <span style="color: #666; font-size: 14px;">
                            {{if or .VariantColor .VariantSize}}
                            {{.VariantColor}} {{.VariantSize}}<br>
                            {{end}}
                            Quantity: {{.Quantity}}
                        </span>
                    </td>
                    <td class="text-right strong">₹{{printf "%.2f" .Total}}</td>
                </tr>
                {{end}}
            </table>
        </div>
        
        <div class="section">
            <table>
                <tr>
                    <td>Subtotal</td>
                    <td class="text-right">₹{{printf "%.2f" .Subtotal}}</td>
                </tr>
                <tr>
                    <td>Shipping</td>
                    <td class="text-right">₹{{printf "%.2f" .Shipping}}</td>
                </tr>
                <tr>
                    <td>Tax</td>
                    <td class="text-right">₹{{printf "%.2f" .Tax}}</td>
                </tr>
                <tr class="total-row">
                    <td>Total</td>
                    <td class="text-right">₹{{printf "%.2f" .Total}}</td>
                </tr>
            </table>
        </div>
        
        <div class="address">
            <div class="section-title">Shipping Address</div>
            {{.ShippingAddress.Line1}}<br>
            {{if .ShippingAddress.Line2}}{{.ShippingAddress.Line2}}<br>{{end}}
            {{.ShippingAddress.City}}, {{.ShippingAddress.State}} {{.ShippingAddress.PostalCode}}<br>
            {{.ShippingAddress.Country}}
        </div>
        
        <div class="footer">
            <p>Questions? Contact us at orders@tripundlifestyle.com</p>
            <p>TRIPUND Lifestyle<br>
            Premium Indian Handicrafts</p>
        </div>
    </div>
</body>
</html>`
  },
  {
    id: 'festive-order-template',
    name: 'Festive Order Confirmation',
    subject: '🎉 Order Confirmed - {{.OrderNumber}}',
    type: 'order_confirmation',
    category: 'transactional',
    is_active: true,
    is_default: false,
    variables: [
      {key: 'CustomerName', label: 'Customer Name', type: 'string', required: true, example: 'John Doe'},
      {key: 'CustomerEmail', label: 'Customer Email', type: 'string', required: true, example: 'customer@email.com'},
      {key: 'OrderNumber', label: 'Order Number', type: 'string', required: true, example: 'ORD-2025-123456'},
      {key: 'OrderDate', label: 'Order Date', type: 'date', required: true, example: 'January 2, 2025'},
      {key: 'Items', label: 'Order Items', type: 'array', required: true},
      {key: 'Subtotal', label: 'Subtotal', type: 'number', required: true, example: '9999.00'},
      {key: 'Shipping', label: 'Shipping Cost', type: 'number', required: true, example: '100.00'},
      {key: 'Tax', label: 'Tax Amount', type: 'number', required: true, example: '1800.00'},
      {key: 'Total', label: 'Total Amount', type: 'number', required: true, example: '11899.00'},
      {key: 'ShippingAddress', label: 'Shipping Address', type: 'object', required: true}
    ],
    html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: 'Georgia', serif; margin: 0; padding: 0; background: linear-gradient(45deg, #FF6B6B, #FFE66D); }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%); color: white; padding: 40px; text-align: center; position: relative; }
        .header::before { content: "🪔"; position: absolute; left: 30px; top: 30px; font-size: 40px; }
        .header::after { content: "🪔"; position: absolute; right: 30px; top: 30px; font-size: 40px; }
        .header h1 { margin: 0; font-size: 36px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .decoration { text-align: center; font-size: 30px; margin: 20px 0; }
        .content { padding: 40px; }
        .greeting { font-size: 26px; color: #FF6B6B; margin-bottom: 20px; font-weight: bold; }
        .festive-box { background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); border: 2px dashed #FF6B6B; padding: 25px; border-radius: 15px; margin: 25px 0; }
        .item-box { background: white; border-radius: 15px; padding: 20px; margin: 15px 0; border: 2px solid #FFE66D; }
        .rangoli-pattern { text-align: center; margin: 30px 0; }
        .price-tag { display: inline-block; background: #FF6B6B; color: white; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 18px; }
        .total-celebration { background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%); color: white; padding: 30px; border-radius: 20px; margin: 30px 0; text-align: center; }
        .total-celebration h3 { font-size: 28px; margin: 10px 0; }
        .address-card { background: #FFF9C4; padding: 25px; border-radius: 15px; border-left: 5px solid #FF6B6B; }
        .footer { background: linear-gradient(135deg, #FFE66D 0%, #FF6B6B 100%); color: white; padding: 30px; text-align: center; }
        .blessing { font-style: italic; font-size: 18px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎊 ORDER CONFIRMED 🎊</h1>
            <p style="margin: 10px 0; font-size: 18px;">Your Festive Shopping is Complete!</p>
        </div>
        
        <div class="decoration">✨🌸🪷🌸✨</div>
        
        <div class="content">
            <div class="greeting">
                Namaste {{.CustomerName}}! 🙏
            </div>
            
            <p style="font-size: 18px; color: #666; line-height: 1.8;">
                May your purchase bring joy and prosperity to your home. Our artisans have blessed your order with their craftsmanship!
            </p>
            
            <div class="festive-box">
                <h3 style="color: #FF6B6B; margin: 0 0 15px;">🎁 Order Details</h3>
                <p><strong>Order Number:</strong> {{.OrderNumber}}</p>
                <p><strong>Order Date:</strong> {{.OrderDate}}</p>
                <p><strong>Email:</strong> {{.CustomerEmail}}</p>
            </div>
            
            <div class="rangoli-pattern">🔶🔸🔶🔸🔶</div>
            
            <h3 style="color: #FF6B6B; font-size: 24px;">Your Festive Collection:</h3>
            {{range .Items}}
            <div class="item-box">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="font-size: 18px; color: #333;">{{.ProductName}}</strong>
                        {{if or .VariantColor .VariantSize}}
                        <div style="color: #666; margin-top: 5px;">
                            {{if .VariantColor}}🎨 {{.VariantColor}}{{end}}
                            {{if and .VariantColor .VariantSize}} | {{end}}
                            {{if .VariantSize}}📏 {{.VariantSize}}{{end}}
                        </div>
                        {{end}}
                        <div style="margin-top: 10px; color: #999;">
                            Quantity: {{.Quantity}} × ₹{{printf "%.2f" .Price}}
                        </div>
                    </div>
                    <div class="price-tag">₹{{printf "%.2f" .Total}}</div>
                </div>
            </div>
            {{end}}
            
            <div class="total-celebration">
                <div class="decoration">💫⭐💫</div>
                <div style="margin: 20px 0;">
                    <div>Subtotal: ₹{{printf "%.2f" .Subtotal}}</div>
                    <div>Shipping: ₹{{printf "%.2f" .Shipping}}</div>
                    <div>Tax: ₹{{printf "%.2f" .Tax}}</div>
                </div>
                <h3>Grand Total: ₹{{printf "%.2f" .Total}}</h3>
                <div class="decoration">💫⭐💫</div>
            </div>
            
            <div class="address-card">
                <h3 style="color: #FF6B6B; margin: 0 0 15px;">🏠 Delivery Address</h3>
                <p style="line-height: 1.8;">
                    {{.ShippingAddress.Line1}}<br>
                    {{if .ShippingAddress.Line2}}{{.ShippingAddress.Line2}}<br>{{end}}
                    {{.ShippingAddress.City}}, {{.ShippingAddress.State}} {{.ShippingAddress.PostalCode}}<br>
                    {{.ShippingAddress.Country}}
                </p>
            </div>
            
            <div class="blessing">
                "May these handcrafted treasures bring happiness and good fortune to your home"
            </div>
        </div>
        
        <div class="footer">
            <div class="decoration">🪔🌺🪔🌺🪔</div>
            <h3>TRIPUND Lifestyle</h3>
            <p>Celebrating Indian Artistry</p>
            <p style="margin-top: 20px; opacity: 0.9;">Thank you for supporting Indian artisans!</p>
        </div>
    </div>
</body>
</html>`
  },
  {
    id: 'modern-shipping-template',
    name: 'Modern Shipping Confirmation',
    subject: '📦 Your Order {{.OrderNumber}} Has Shipped!',
    type: 'shipping_confirmation',
    category: 'transactional',
    is_active: true,
    is_default: true,
    variables: [
      {key: 'CustomerName', label: 'Customer Name', type: 'string', required: true, example: 'John Doe'},
      {key: 'OrderNumber', label: 'Order Number', type: 'string', required: true, example: 'ORD-2025-123456'},
      {key: 'TrackingNumber', label: 'Tracking Number', type: 'string', required: true, example: 'TRK123456789'},
      {key: 'TrackingURL', label: 'Tracking URL', type: 'string', required: false},
      {key: 'Carrier', label: 'Shipping Carrier', type: 'string', required: true, example: 'DHL Express'},
      {key: 'EstimatedDelivery', label: 'Estimated Delivery', type: 'string', required: false, example: '3-5 business days'},
      {key: 'Items', label: 'Order Items', type: 'array', required: true},
      {key: 'ShippingAddress', label: 'Delivery Address', type: 'object', required: true}
    ],
    html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shipping Confirmation</title>
    <style>
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #28a745; color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .tracking-hero { background: #e8f5e9; padding: 30px; text-align: center; margin: 20px; border-radius: 10px; }
        .tracking-number { font-size: 24px; font-weight: bold; color: #28a745; letter-spacing: 2px; margin: 10px 0; }
        .track-button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .content { padding: 20px 40px; }
        .status-timeline { display: flex; justify-content: space-between; margin: 30px 0; padding: 0 20px; }
        .status-item { text-align: center; flex: 1; }
        .status-icon { width: 40px; height: 40px; border-radius: 50%; background: #28a745; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
        .status-item.pending .status-icon { background: #ccc; }
        .items-list { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #333; color: white; padding: 30px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 YOUR ORDER IS ON THE WAY!</h1>
            <p>Get ready to receive your handcrafted treasures</p>
        </div>
        
        <div class="tracking-hero">
            <p style="margin: 0; color: #666;">TRACKING NUMBER</p>
            <div class="tracking-number">{{.TrackingNumber}}</div>
            <p style="color: #666;">Carrier: {{.Carrier}}</p>
            {{if .TrackingURL}}
            <a href="{{.TrackingURL}}" class="track-button">TRACK PACKAGE</a>
            {{end}}
        </div>
        
        <div class="content">
            <p>Hello {{.CustomerName}},</p>
            <p>Great news! Your order {{.OrderNumber}} has been shipped and is on its way to you.</p>
            
            {{if .EstimatedDelivery}}
            <p><strong>Estimated Delivery:</strong> {{.EstimatedDelivery}}</p>
            {{end}}
            
            <div class="status-timeline">
                <div class="status-item">
                    <div class="status-icon">✓</div>
                    <div>Order Placed</div>
                </div>
                <div class="status-item">
                    <div class="status-icon">✓</div>
                    <div>Processed</div>
                </div>
                <div class="status-item">
                    <div class="status-icon">✓</div>
                    <div>Shipped</div>
                </div>
                <div class="status-item pending">
                    <div class="status-icon">⋯</div>
                    <div>Delivered</div>
                </div>
            </div>
            
            <div class="items-list">
                <h3>Items in this shipment:</h3>
                {{range .Items}}
                <div style="padding: 10px 0; border-bottom: 1px solid #ddd;">
                    <strong>{{.ProductName}}</strong><br>
                    {{if or .VariantColor .VariantSize}}
                    <span style="color: #666; font-size: 14px;">
                        {{.VariantColor}} {{.VariantSize}}
                    </span><br>
                    {{end}}
                    Quantity: {{.Quantity}}
                </div>
                {{end}}
            </div>
            
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4>Delivery Address:</h4>
                <p>
                    {{.ShippingAddress.Line1}}<br>
                    {{if .ShippingAddress.Line2}}{{.ShippingAddress.Line2}}<br>{{end}}
                    {{.ShippingAddress.City}}, {{.ShippingAddress.State}} {{.ShippingAddress.PostalCode}}<br>
                    {{.ShippingAddress.Country}}
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>TRIPUND Lifestyle</p>
            <p style="opacity: 0.8;">Questions? Contact us at orders@tripundlifestyle.com</p>
        </div>
    </div>
</body>
</html>`
  }
];

async function seedTemplates() {
  console.log('🌱 Seeding email templates to Firestore...\n');

  for (const template of templates) {
    try {
      // Add timestamps
      const templateData = {
        ...template,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      // Create the template
      await db.collection('email_templates').doc(template.id).set(templateData);
      console.log(`✅ Created template: ${template.name}`);
    } catch (error) {
      console.error(`❌ Failed to create template ${template.name}:`, error);
    }
  }

  console.log('\n✨ Email templates seeded successfully!');
  console.log('You can now access them in your admin panel at /email-templates');
  process.exit(0);
}

// Run the seeding
seedTemplates().catch(error => {
  console.error('Error seeding templates:', error);
  process.exit(1);
});