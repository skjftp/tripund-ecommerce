// Final WhatsApp setup with correct WABA ID from the URL
const fetch = require('node-fetch');

const WHATSAPP_ACCESS_TOKEN = 'EAAVQgNlLiz4BPbgJQIOcDv1CY9h1RLQCFlToEMCEDS3B8xSF4EZBTCg7LKUlh20Ql7TZCwexxZBjBCLjzYkawShIS1txAJYu2xjxJEFn8ZAzoFtWGeJIsYAuiCJHIKhZCa9u2Sne33GKM79i7fZADw7GaK9lAYZBKtvdA9ykHEE76qdbZBx5SIHl3yWXAO6OuD8lYgZDZD';
const WABA_ID = '1836026090679932'; // From the URL asset_id
const BASE_URL = 'https://graph.facebook.com/v18.0';

async function getPhoneNumberDetails() {
    try {
        console.log('📞 Getting phone number details for WABA:', WABA_ID);
        
        const response = await fetch(`${BASE_URL}/${WABA_ID}/phone_numbers`, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            },
        });

        const data = await response.json();
        console.log('Phone Numbers Response:', JSON.stringify(data, null, 2));

        if (data.data && data.data.length > 0) {
            const phoneNumber = data.data[0];
            console.log('\n✅ Phone Number Found:');
            console.log('Phone Number ID:', phoneNumber.id);
            console.log('Display Phone Number:', phoneNumber.display_phone_number);
            console.log('Verified Name:', phoneNumber.verified_name);
            console.log('Quality Rating:', phoneNumber.quality_rating);
            
            return phoneNumber.id;
        } else {
            console.error('❌ No phone numbers found');
            if (data.error) {
                console.error('Error:', data.error.message);
            }
        }
    } catch (error) {
        console.error('❌ Error fetching phone numbers:', error);
    }
}

async function getTemplates() {
    try {
        console.log('\n📄 Getting message templates for WABA:', WABA_ID);
        
        const response = await fetch(`${BASE_URL}/${WABA_ID}/message_templates`, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            },
        });

        const data = await response.json();
        console.log('Templates Response:', JSON.stringify(data, null, 2));

        if (data.data) {
            console.log(`\n📊 Found ${data.data.length} templates:`);
            data.data.forEach(template => {
                console.log(`- ${template.name} (${template.language}) - Status: ${template.status} - Category: ${template.category}`);
            });
            return data.data;
        }
    } catch (error) {
        console.error('❌ Error fetching templates:', error);
    }
}

async function sendTestMessage(phoneNumberId) {
    try {
        console.log('\n📨 Sending test message...');
        
        const phoneNumber = '919711441830'; // Your test phone number
        
        const messageData = {
            messaging_product: "whatsapp",
            recipient_type: "individual", 
            to: phoneNumber,
            type: "text",
            text: {
                preview_url: false,
                body: "🎉 Hello from TRIPUND Lifestyle! \n\nYour WhatsApp Business API integration is now LIVE and working perfectly! \n\n✅ Order confirmations\n✅ Shipping notifications\n✅ Admin messaging\n✅ Bulk campaigns\n\nWelcome to seamless customer communication! 🚀"
            }
        };

        const response = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
        });

        const result = await response.json();
        console.log('Send Message Response:', JSON.stringify(result, null, 2));

        if (result.messages && result.messages.length > 0) {
            console.log('✅ Test message sent successfully!');
            console.log('📞 Message ID:', result.messages[0].id);
            return true;
        } else {
            console.error('❌ Failed to send test message');
            if (result.error) {
                console.error('Error:', result.error.message);
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending test message:', error);
        return false;
    }
}

async function createOrderConfirmationTemplate(wabaId) {
    try {
        console.log('\n📄 Creating order confirmation template...');
        
        const templateData = {
            name: "tripund_order_confirmation",
            language: "en_US",
            category: "UTILITY",
            components: [
                {
                    type: "BODY",
                    text: "🎉 Order Confirmed!\n\nDear {{1}},\n\nYour order #{{2}} has been confirmed successfully.\n\n💰 Total Amount: ₹{{3}}\n\nWe'll notify you once your order is shipped. Thank you for choosing TRIPUND!\n\n🌐 Track: https://tripundlifestyle.netlify.app/orders"
                }
            ]
        };

        const response = await fetch(`${BASE_URL}/${wabaId}/message_templates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateData),
        });

        const result = await response.json();
        console.log('Create Template Response:', JSON.stringify(result, null, 2));

        if (result.id) {
            console.log('✅ Order confirmation template created successfully!');
            console.log('Template ID:', result.id);
        } else {
            console.log('❌ Template creation may have failed or already exists');
        }
    } catch (error) {
        console.error('❌ Error creating template:', error);
    }
}

async function createShippingTemplate(wabaId) {
    try {
        console.log('\n📦 Creating shipping confirmation template...');
        
        const templateData = {
            name: "tripund_shipping_confirmation", 
            language: "en_US",
            category: "UTILITY",
            components: [
                {
                    type: "BODY",
                    text: "🚚 Order Shipped!\n\nDear {{1}},\n\nGreat news! Your order #{{2}} has been shipped and is on its way to you.\n\n📱 Track your shipment: {{3}}\n\nExpected delivery: 3-7 business days\n\nThank you for shopping with TRIPUND!"
                }
            ]
        };

        const response = await fetch(`${BASE_URL}/${wabaId}/message_templates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateData),
        });

        const result = await response.json();
        console.log('Create Shipping Template Response:', JSON.stringify(result, null, 2));

        if (result.id) {
            console.log('✅ Shipping confirmation template created successfully!');
            console.log('Template ID:', result.id);
        } else {
            console.log('❌ Shipping template creation may have failed or already exists');
        }
    } catch (error) {
        console.error('❌ Error creating shipping template:', error);
    }
}

async function main() {
    console.log('🚀 TRIPUND WhatsApp Business API - Final Setup');
    console.log('=' .repeat(60));
    console.log('WABA ID:', WABA_ID);
    console.log('Business Phone:', '+91 97114 41830');
    console.log('Business Name: Tripund Lifestyle');
    console.log('=' .repeat(60));
    
    // Step 1: Get phone number details
    const phoneNumberId = await getPhoneNumberDetails();
    
    // Step 2: Get existing templates
    const templates = await getTemplates();
    
    // Step 3: Create essential templates
    await createOrderConfirmationTemplate(WABA_ID);
    await createShippingTemplate(WABA_ID);
    
    // Step 4: Send test message
    if (phoneNumberId) {
        const testSuccess = await sendTestMessage(phoneNumberId);
        
        if (testSuccess) {
            console.log('\n🎉 WHATSAPP INTEGRATION SETUP COMPLETE!');
            console.log('=' .repeat(60));
            console.log('📋 Environment Variables to Set:');
            console.log('WHATSAPP_BUSINESS_ID =', WABA_ID);
            console.log('WHATSAPP_PHONE_NUMBER_ID =', phoneNumberId);
            console.log('WHATSAPP_ACCESS_TOKEN = [ALREADY SET]');
            console.log('WHATSAPP_WEBHOOK_SECRET = tripund-wa-secret');
            console.log('');
            console.log('🔧 Next Steps:');
            console.log('1. Update Cloud Run environment variables');
            console.log('2. Set webhook URL in WhatsApp Manager:');
            console.log('   https://tripund-backend-665685012221.asia-south1.run.app/api/v1/webhook/whatsapp');
            console.log('3. Wait for template approvals (24-48 hours)');
            console.log('4. Test the admin panel WhatsApp section');
            console.log('');
            console.log('✅ Your WhatsApp Business API is LIVE and ready!');
        }
    } else {
        console.log('\n❌ Setup incomplete - could not get phone number ID');
    }
}

main().catch(console.error);