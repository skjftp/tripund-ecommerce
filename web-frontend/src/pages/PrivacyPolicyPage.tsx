import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/content/legal');
      if (response.data?.privacy_policy) {
        setContent(response.data.privacy_policy);
      } else {
        // Fallback content if API doesn't return privacy policy
        setContent(getDefaultContent());
      }
    } catch (error) {
      console.error('Failed to fetch privacy policy:', error);
      // Use default content on error
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    return `# Privacy Policy

Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

At TRIPUND Lifestyle, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases from our online store.

## 1. Information We Collect

### Personal Information
- Name and contact information (email address, phone number)
- Billing and shipping addresses
- Payment information (processed securely through Razorpay)
- Order history and preferences
- Account credentials (username and encrypted password)

### Automatically Collected Information
- IP address and browser information
- Device information and operating system
- Browsing behavior and pages visited
- Cookies and similar tracking technologies

## 2. How We Use Your Information

We use the collected information for the following purposes:
- Process and fulfill your orders
- Send order confirmations and shipping notifications
- Respond to customer service inquiries
- Personalize your shopping experience
- Send promotional emails (with your consent)
- Improve our website and services
- Prevent fraudulent transactions
- Comply with legal obligations

## 3. Information Sharing

We do not sell, trade, or rent your personal information to third parties. We may share your information with:
- Payment processors (Razorpay) for secure payment processing
- Shipping partners for order delivery
- Service providers who assist in our operations
- Law enforcement agencies when required by law

## 4. Data Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
- SSL encryption for data transmission
- Secure payment processing through trusted providers
- Regular security audits and updates
- Limited access to personal information

## 5. Your Rights

You have the following rights regarding your personal information:
- Access your personal information
- Correct or update inaccurate data
- Request deletion of your account
- Opt-out of marketing communications
- Lodge a complaint with supervisory authorities

## 6. Cookies

We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.

## 7. Contact Us

If you have any questions about this Privacy Policy or our data practices, please contact us at:

Email: privacy@tripundlifestyle.com  
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