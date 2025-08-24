import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

export default function TermsConditionsPage() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/content/legal');
      if (response.data?.terms_conditions) {
        setContent(response.data.terms_conditions);
      } else {
        // Fallback content if API doesn't return terms
        setContent(getDefaultContent());
      }
    } catch (error) {
      console.error('Failed to fetch terms and conditions:', error);
      // Use default content on error
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    return `# Terms and Conditions

Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

## 1. Agreement to Terms

By accessing and using the TRIPUND Lifestyle website ("Site"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our Site.

## 2. Use of the Website

### Eligibility
You must be at least 18 years old to use our services and make purchases on our Site.

### Account Responsibilities
- You are responsible for maintaining the confidentiality of your account information
- You agree to provide accurate and current information
- You are responsible for all activities under your account

## 3. Products and Services

### Product Information
- We strive to display accurate product descriptions and images
- Colors may vary slightly due to monitor settings
- All products are handcrafted and may have slight variations
- We reserve the right to limit quantities of any products

### Pricing
- All prices are listed in Indian Rupees (INR)
- Prices include applicable taxes unless otherwise stated
- We reserve the right to change prices at any time
- Promotional offers cannot be combined unless specified

## 4. Orders and Payment

### Order Acceptance
- All orders are subject to acceptance and availability
- We reserve the right to refuse or cancel any order
- Order confirmation email does not constitute acceptance

### Payment Terms
- Payment must be received before order processing
- We accept various payment methods through secure payment gateway
- You agree to provide valid payment information

## 5. Shipping and Delivery

### Shipping Policy
- We ship to addresses within India
- Shipping charges vary based on order value and location
- Estimated delivery times are not guaranteed
- Risk of loss passes to you upon delivery

### Delivery Issues
- Please inspect products upon delivery
- Report any damages within 48 hours
- We are not responsible for delays due to unforeseen circumstances

## 6. Returns and Refunds

### Return Policy
- Products can be returned within 7 days of delivery
- Items must be unused and in original packaging
- Custom or personalized items cannot be returned
- Return shipping costs are the customer's responsibility

### Refund Process
- Refunds are processed after inspection of returned items
- Refunds are issued to the original payment method
- Processing time is 7-10 business days

## 7. Intellectual Property

All content on this Site, including text, graphics, logos, images, and software, is the property of TRIPUND Lifestyle and protected by intellectual property laws. You may not use, reproduce, or distribute any content without our written permission.

## 8. Limitation of Liability

To the maximum extent permitted by law, TRIPUND Lifestyle shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Site or products.

## 9. Indemnification

You agree to indemnify and hold TRIPUND Lifestyle harmless from any claims, losses, damages, liabilities, and expenses arising from your use of the Site or violation of these Terms.

## 10. Privacy

Your use of our Site is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.

## 11. Governing Law

These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.

## 12. Changes to Terms

We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on the Site.

## 13. Contact Information

If you have any questions about these Terms, please contact us at:

Email: legal@tripundlifestyle.com  
Phone: +91 98765 43210  
Address: Mumbai, Maharashtra, India`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <article className="prose prose-lg max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}