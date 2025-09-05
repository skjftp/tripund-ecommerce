// Update template URL to correct TRIPUND orders page
const fetch = require('node-fetch');

const WHATSAPP_ACCESS_TOKEN = 'EAAVQgNlLiz4BPbgJQIOcDv1CY9h1RLQCFlToEMCEDS3B8xSF4EZBTCg7LKUlh20Ql7TZCwexxZBjBCLjzYkawShIS1txAJYu2xjxJEFn8ZAzoFtWGeJIsYAuiCJHIKhZCa9u2Sne33GKM79i7fZADw7GaK9lAYZBKtvdA9ykHEE76qdbZBx5SIHl3yWXAO6OuD8lYgZDZD';
const WABA_ID = '1836026090679932';
const BASE_URL = 'https://graph.facebook.com/v18.0';

async function updateTemplateUrl() {
    try {
        console.log('🔧 Creating new template with correct TRIPUND URL...');
        
        const templateData = {
            name: "tripund_order_confirmed",
            language: "en_US", 
            category: "UTILITY",
            components: [
                {
                    type: "HEADER",
                    format: "TEXT",
                    text: "Order confirmed"
                },
                {
                    type: "BODY",
                    text: "Dear {{1}},\n\nThank you for your purchase! Your order number is {{2}}.\n\nWe'll notify you once your order is shipped.\n\nEstimated delivery: {{3}}\n\nThank you for choosing TRIPUND Lifestyle"
                },
                {
                    type: "BUTTONS",
                    buttons: [
                        {
                            type: "URL",
                            text: "View order details",
                            url: "https://tripundlifestyle.com/orders"
                        }
                    ]
                }
            ]
        };

        const response = await fetch(`${BASE_URL}/${WABA_ID}/message_templates`, {
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
            console.log('✅ New template created successfully with correct URL!');
            console.log('Template Name: tripund_order_confirmed');
            console.log('Template ID:', result.id);
            console.log('URL: https://tripundlifestyle.com/orders');
            console.log('Status: PENDING (will be approved in 24-48 hours)');
        } else {
            console.log('❌ Template creation failed or template already exists');
            if (result.error) {
                console.log('Error:', result.error.message);
            }
        }
    } catch (error) {
        console.error('❌ Error creating template:', error);
    }
}

async function getCurrentTemplates() {
    try {
        console.log('📋 Current templates:');
        
        const response = await fetch(`${BASE_URL}/${WABA_ID}/message_templates`, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            },
        });

        const data = await response.json();
        
        if (data.data) {
            data.data.forEach(template => {
                console.log(`- ${template.name} (${template.language}) - Status: ${template.status}`);
                
                // Show button URLs if they exist
                template.components.forEach(comp => {
                    if (comp.type === 'BUTTONS' && comp.buttons) {
                        comp.buttons.forEach(btn => {
                            if (btn.type === 'URL') {
                                console.log(`  Button: "${btn.text}" → ${btn.url}`);
                            }
                        });
                    }
                });
            });
        }
    } catch (error) {
        console.error('❌ Error fetching templates:', error);
    }
}

async function main() {
    console.log('🚀 TRIPUND WhatsApp Template URL Fix');
    console.log('=' .repeat(50));
    
    await getCurrentTemplates();
    console.log('\n');
    await updateTemplateUrl();
    
    console.log('\n📋 Next Steps:');
    console.log('1. Wait for new template approval (24-48 hours)');
    console.log('2. Use "tripund_order_confirmed" template with correct URL');
    console.log('3. Update admin panel to show template button URLs');
}

main().catch(console.error);