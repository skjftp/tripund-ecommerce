// Test WhatsApp Business API integration
const fetch = require('node-fetch');

const WHATSAPP_ACCESS_TOKEN = 'EAAVQgNlLiz4BPbgJQIOcDv1CY9h1RLQCFlToEMCEDS3B8xSF4EZBTCg7LKUlh20Ql7TZCwexxZBjBCLjzYkawShIS1txAJYu2xjxJEFn8ZAzoFtWGeJIsYAuiCJHIKhZCa9u2Sne33GKM79i7fZADw7GaK9lAYZBKtvdA9ykHEE76qdbZBx5SIHl3yWXAO6OuD8lYgZDZD';
const BUSINESS_ID = '657280173978203';
const BASE_URL = 'https://graph.facebook.com/v18.0';

async function getPhoneNumberId() {
    try {
        const response = await fetch(`${BASE_URL}/${BUSINESS_ID}/phone_numbers`, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            },
        });

        const data = await response.json();
        console.log('Phone Numbers Response:', JSON.stringify(data, null, 2));

        if (data.data && data.data.length > 0) {
            const phoneNumberId = data.data[0].id;
            const displayPhoneNumber = data.data[0].display_phone_number;
            const verifiedName = data.data[0].verified_name;
            
            console.log('🎉 WhatsApp Phone Number ID:', phoneNumberId);
            console.log('📞 Display Phone Number:', displayPhoneNumber);
            console.log('✅ Verified Name:', verifiedName);
            
            return phoneNumberId;
        } else {
            console.error('❌ No phone numbers found');
        }
    } catch (error) {
        console.error('❌ Error fetching phone number ID:', error);
    }
}

async function getTemplates() {
    try {
        const response = await fetch(`${BASE_URL}/${BUSINESS_ID}/message_templates`, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            },
        });

        const data = await response.json();
        console.log('\n📄 Templates Response:', JSON.stringify(data, null, 2));
        
        if (data.data) {
            console.log(`\n📊 Found ${data.data.length} templates:`);
            data.data.forEach(template => {
                console.log(`- ${template.name} (${template.language}) - Status: ${template.status}`);
            });
        }
    } catch (error) {
        console.error('❌ Error fetching templates:', error);
    }
}

async function sendTestMessage(phoneNumberId) {
    try {
        const phoneNumber = '919711441830'; // Test phone number
        
        const messageData = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type: "text",
            text: {
                preview_url: false,
                body: "🎉 Hello from TRIPUND! Your WhatsApp Business API is working perfectly. This is a test message to verify our integration."
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
        console.log('\n📨 Send Message Response:', JSON.stringify(result, null, 2));

        if (result.messages && result.messages.length > 0) {
            console.log('✅ Test message sent successfully!');
            console.log('📞 Message ID:', result.messages[0].id);
        } else {
            console.error('❌ Failed to send test message');
        }
    } catch (error) {
        console.error('❌ Error sending test message:', error);
    }
}

async function testWhatsAppIntegration() {
    console.log('🚀 Testing TRIPUND WhatsApp Business API Integration');
    console.log('=' .repeat(60));
    
    // Step 1: Get Phone Number ID
    const phoneNumberId = await getPhoneNumberId();
    
    // Step 2: Get Templates
    await getTemplates();
    
    // Step 3: Send Test Message (if phone number ID is available)
    if (phoneNumberId) {
        await sendTestMessage(phoneNumberId);
    }
    
    console.log('\n✅ WhatsApp integration test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update WHATSAPP_PHONE_NUMBER_ID environment variable with:', phoneNumberId);
    console.log('2. Set up webhook URL: https://tripund-backend-665685012221.asia-south1.run.app/api/v1/webhook/whatsapp');
    console.log('3. Create message templates for order confirmations and shipping notifications');
    console.log('4. Test the admin panel WhatsApp section');
}

// Run the test
testWhatsAppIntegration().catch(console.error);