const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'tripund-ecommerce-1755860933'
});

const db = admin.firestore();

async function initializeContent() {
  try {
    // Initialize About content
    const aboutContent = {
      type: 'about',
      title: 'About Page',
      content: {
        data: {
          title: 'About TRIPUND Lifestyle',
          subtitle: 'Celebrating Indian Craftsmanship',
          mainContent: 'At TRIPUND, we bridge the gap between traditional Indian artisans and modern homes. Each piece in our collection tells a story of heritage, skill, and passion passed down through generations.',
          mission: 'To preserve and promote traditional Indian handicrafts while empowering artisan communities.',
          vision: 'To be the leading platform connecting Indian artisans with global markets.',
          values: ['Authenticity', 'Sustainability', 'Craftsmanship', 'Fair Trade'],
          stats: [
            { number: '500+', label: 'Artisan Partners' },
            { number: '15', label: 'Indian States' },
            { number: '100%', label: 'Handcrafted' }
          ],
          whyChooseUs: [
            'Direct from artisan partnerships',
            'Authentic handcrafted products',
            'Supporting traditional crafts',
            'Quality assured products'
          ]
        }
      },
      published: true,
      last_updated: new Date()
    };

    await db.collection('content').doc('about').set(aboutContent);
    console.log('✅ About content initialized');

    // Initialize Footer content
    const footerContent = {
      type: 'footer',
      title: 'Footer Content',
      content: {
        data: {
          companyName: 'TRIPUND Lifestyle',
          companyDescription: 'Premium Indian artisan marketplace specializing in handcrafted wall decor, spiritual art, and cultural artifacts.',
          email: 'support@tripundlifestyle.com',
          phone: '+91 98765 43210',
          address: {
            street: '123 Artisan Street',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            pincode: '110001'
          },
          socialLinks: {
            facebook: 'https://facebook.com/tripundlifestyle',
            instagram: 'https://instagram.com/tripundlifestyle',
            twitter: 'https://twitter.com/tripundlifestyle'
          },
          copyrightText: '© 2024 TRIPUND Lifestyle. All rights reserved.'
        }
      },
      published: true,
      last_updated: new Date()
    };

    await db.collection('content').doc('footer').set(footerContent);
    console.log('✅ Footer content initialized');

    // Initialize Contact content
    const contactContent = {
      type: 'contact',
      title: 'Contact Page',
      content: {
        data: {
          title: 'Get In Touch',
          subtitle: "We'd love to hear from you",
          description: 'Have questions about our products or want to know more about our artisan partners? Feel free to reach out!',
          email: 'support@tripundlifestyle.com',
          phone: '+91 98765 43210',
          whatsapp: '+91 98765 43210',
          address: {
            street: '123 Artisan Street',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            pincode: '110001'
          },
          businessHours: [
            'Monday - Friday: 9:00 AM - 6:00 PM',
            'Saturday: 10:00 AM - 4:00 PM',
            'Sunday: Closed'
          ]
        }
      },
      published: true,
      last_updated: new Date()
    };

    await db.collection('content').doc('contact').set(contactContent);
    console.log('✅ Contact content initialized');

    // Initialize FAQs
    const faqs = [
      {
        question: 'What makes TRIPUND products unique?',
        answer: 'All our products are handcrafted by skilled artisans from various parts of India, ensuring each piece is unique and carries the authentic touch of traditional craftsmanship.',
        order: 1,
        active: true,
        created: new Date(),
        updated: new Date()
      },
      {
        question: 'Do you offer international shipping?',
        answer: 'Yes, we ship worldwide. International shipping charges and delivery times vary by location. Please check our shipping policy for more details.',
        order: 2,
        active: true,
        created: new Date(),
        updated: new Date()
      },
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for all products. Items must be unused and in their original packaging. Custom orders are non-refundable.',
        order: 3,
        active: true,
        created: new Date(),
        updated: new Date()
      },
      {
        question: 'How do I care for handcrafted products?',
        answer: 'Care instructions vary by product type. Each product comes with specific care guidelines. Generally, avoid direct sunlight and moisture for most handicrafts.',
        order: 4,
        active: true,
        created: new Date(),
        updated: new Date()
      },
      {
        question: 'Can I request custom designs?',
        answer: 'Yes, we accept custom orders for many of our product categories. Please contact us with your requirements and we\'ll connect you with the right artisan.',
        order: 5,
        active: true,
        created: new Date(),
        updated: new Date()
      }
    ];

    // Add FAQs
    for (const faq of faqs) {
      await db.collection('faqs').add(faq);
    }
    console.log('✅ FAQs initialized');

    console.log('\n🎉 All content successfully initialized!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing content:', error);
    process.exit(1);
  }
}

initializeContent();