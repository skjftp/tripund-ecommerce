// Get WhatsApp Business Account info from system user token
const fetch = require('node-fetch');

const WHATSAPP_ACCESS_TOKEN = 'EAAVQgNlLiz4BPbgJQIOcDv1CY9h1RLQCFlToEMCEDS3B8xSF4EZBTCg7LKUlh20Ql7TZCwexxZBjBCLjzYkawShIS1txAJYu2xjxJEFn8ZADw7GaK9lAYZBKtvdA9ykHEE76qdbZBx5SIHl3yWXAO6OuD8lYgZDZD';
const BASE_URL = 'https://graph.facebook.com/v18.0';

async function exploreTokenPermissions() {
    try {
        console.log('🔍 Exploring token permissions and accessible resources...');
        
        // Get token info with permissions
        const tokenResponse = await fetch(`${BASE_URL}/me?fields=id,name&access_token=${WHATSAPP_ACCESS_TOKEN}`);
        const tokenData = await tokenResponse.json();
        console.log('Token Info:', JSON.stringify(tokenData, null, 2));
        
        // Try to get permissions
        const permResponse = await fetch(`${BASE_URL}/${tokenData.id}/permissions?access_token=${WHATSAPP_ACCESS_TOKEN}`);
        const permData = await permResponse.json();
        console.log('\nToken Permissions:', JSON.stringify(permData, null, 2));
        
        // Try debug token
        const debugResponse = await fetch(`${BASE_URL}/debug_token?input_token=${WHATSAPP_ACCESS_TOKEN}&access_token=${WHATSAPP_ACCESS_TOKEN}`);
        const debugData = await debugResponse.json();
        console.log('\nToken Debug Info:', JSON.stringify(debugData, null, 2));
        
    } catch (error) {
        console.error('❌ Error exploring token:', error);
    }
}

async function tryCommonWABAIds() {
    // Common WABA ID patterns to try
    const potentialIds = [
        '122102943213000680', // From token info
        '657280173978203',     // Original Business ID
        '1836026090679932',    // Business Account ID from your info
    ];
    
    for (const id of potentialIds) {
        console.log(`\n🔄 Trying WABA ID: ${id}`);
        
        try {
            // Try phone numbers
            const phoneResponse = await fetch(`${BASE_URL}/${id}/phone_numbers`, {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                },
            });
            const phoneData = await phoneResponse.json();
            
            if (phoneData.data && phoneData.data.length > 0) {
                console.log('✅ Found phone numbers for WABA:', id);
                console.log('Phone Numbers:', JSON.stringify(phoneData, null, 2));
                
                // Try templates
                const templateResponse = await fetch(`${BASE_URL}/${id}/message_templates`, {
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    },
                });
                const templateData = await templateResponse.json();
                console.log('Templates:', JSON.stringify(templateData, null, 2));
                
                return id;
            } else {
                console.log('❌ No phone numbers found for:', id);
                if (phoneData.error) {
                    console.log('Error:', phoneData.error.message);
                }
            }
        } catch (error) {
            console.error(`❌ Error trying ID ${id}:`, error.message);
        }
    }
}

async function searchForWhatsAppAssets() {
    try {
        console.log('\n🔍 Searching for WhatsApp assets...');
        
        // Try different Graph API endpoints that might reveal WhatsApp resources
        const endpoints = [
            '/me/accounts',
            '/me/businesses',
            '/me/organizations'
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`\n🔄 Checking: ${endpoint}`);
                const response = await fetch(`${BASE_URL}${endpoint}`, {
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    },
                });
                
                const data = await response.json();
                console.log(`${endpoint} Response:`, JSON.stringify(data, null, 2));
                
                // If we find businesses or accounts, try to get their WhatsApp resources
                if (data.data && data.data.length > 0) {
                    for (const item of data.data) {
                        if (item.id) {
                            await tryWhatsAppEndpoints(item.id, item.name || 'Unknown');
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Error checking ${endpoint}:`, error.message);
            }
        }
    } catch (error) {
        console.error('❌ Error searching for WhatsApp assets:', error);
    }
}

async function tryWhatsAppEndpoints(id, name) {
    console.log(`\n📱 Checking WhatsApp endpoints for: ${name} (${id})`);
    
    const endpoints = [
        'phone_numbers',
        'message_templates',
        'whatsapp_business_accounts'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${BASE_URL}/${id}/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                },
            });
            
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                console.log(`✅ Found ${endpoint} for ${name}:`, JSON.stringify(data, null, 2));
                return id;
            } else if (!data.error || data.error.code !== 100) {
                console.log(`${endpoint} response:`, JSON.stringify(data, null, 2));
            }
        } catch (error) {
            // Ignore errors for non-existent endpoints
        }
    }
}

async function main() {
    console.log('🚀 TRIPUND WhatsApp Business Account Discovery');
    console.log('=' .repeat(60));
    
    await exploreTokenPermissions();
    
    const wabaId = await tryCommonWABAIds();
    
    if (!wabaId) {
        await searchForWhatsAppAssets();
    } else {
        console.log('\n✅ Found Working WABA ID:', wabaId);
    }
    
    console.log('\n📋 Manual Check Required:');
    console.log('1. Log into Facebook Business Manager');
    console.log('2. Go to WhatsApp Manager');
    console.log('3. Find your phone number (+91 97114 41830)');
    console.log('4. Copy the WhatsApp Business Account ID from the URL');
    console.log('5. Update environment variables with the correct WABA ID');
}

main().catch(console.error);