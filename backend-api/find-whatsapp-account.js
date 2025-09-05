// Find WhatsApp Business Account ID
const fetch = require('node-fetch');

const WHATSAPP_ACCESS_TOKEN = 'EAAVQgNlLiz4BPbgJQIOcDv1CY9h1RLQCFlToEMCEDS3B8xSF4EZBTCg7LKUlh20Ql7TZCwexxZBjBCLjzYkawShIS1txAJYu2xjxJEFn8ZAzoFtWGeJIsYAuiCJHIKhZCa9u2Sne33GKM79i7fZADw7GaK9lAYZBKtvdA9ykHEE76qdbZBx5SIHl3yWXAO6OuD8lYgZDZD';
const META_BUSINESS_ID = '657280173978203';
const BASE_URL = 'https://graph.facebook.com/v18.0';

async function findWhatsAppBusinessAccounts() {
    try {
        console.log('🔍 Searching for WhatsApp Business Accounts...');
        
        // Try to get WhatsApp Business Accounts under this Meta Business Account
        const response = await fetch(`${BASE_URL}/${META_BUSINESS_ID}/whatsapp_business_accounts`, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            },
        });

        const data = await response.json();
        console.log('WhatsApp Business Accounts Response:', JSON.stringify(data, null, 2));

        if (data.data && data.data.length > 0) {
            const waba = data.data[0];
            console.log('\n✅ Found WhatsApp Business Account:');
            console.log('WABA ID:', waba.id);
            console.log('Name:', waba.name);
            
            // Now try to get phone numbers for this WABA
            await getPhoneNumbersForWABA(waba.id);
            await getTemplatesForWABA(waba.id);
            
            return waba.id;
        }
    } catch (error) {
        console.error('❌ Error finding WhatsApp Business Accounts:', error);
    }
}

async function getPhoneNumbersForWABA(wabaId) {
    try {
        console.log('\n📞 Getting phone numbers for WABA:', wabaId);
        
        const response = await fetch(`${BASE_URL}/${wabaId}/phone_numbers`, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            },
        });

        const data = await response.json();
        console.log('Phone Numbers Response:', JSON.stringify(data, null, 2));

        if (data.data && data.data.length > 0) {
            const phoneNumber = data.data[0];
            console.log('\n📱 Phone Number Details:');
            console.log('Phone Number ID:', phoneNumber.id);
            console.log('Display Phone Number:', phoneNumber.display_phone_number);
            console.log('Verified Name:', phoneNumber.verified_name);
            console.log('Quality Rating:', phoneNumber.quality_rating);
            
            return phoneNumber.id;
        }
    } catch (error) {
        console.error('❌ Error getting phone numbers:', error);
    }
}

async function getTemplatesForWABA(wabaId) {
    try {
        console.log('\n📄 Getting message templates for WABA:', wabaId);
        
        const response = await fetch(`${BASE_URL}/${wabaId}/message_templates`, {
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
        }
    } catch (error) {
        console.error('❌ Error getting templates:', error);
    }
}

async function tryDirectAccess() {
    try {
        console.log('\n🔄 Trying to access token info directly...');
        
        const response = await fetch(`${BASE_URL}/me?fields=id,name`, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            },
        });

        const data = await response.json();
        console.log('Token Info Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Error getting token info:', error);
    }
}

async function main() {
    console.log('🚀 Finding TRIPUND WhatsApp Business Account Details');
    console.log('=' .repeat(60));
    
    await tryDirectAccess();
    const wabaId = await findWhatsAppBusinessAccounts();
    
    if (wabaId) {
        console.log('\n✅ Integration Setup Complete!');
        console.log('📋 Environment Variables to Update:');
        console.log('WHATSAPP_BUSINESS_ID =', wabaId);
        console.log('WHATSAPP_ACCESS_TOKEN =', WHATSAPP_ACCESS_TOKEN);
        console.log('WHATSAPP_WEBHOOK_SECRET = tripund-wa-secret');
    } else {
        console.log('\n❌ Could not find WhatsApp Business Account');
        console.log('Please check your access token and Meta Business Account configuration');
    }
}

main().catch(console.error);