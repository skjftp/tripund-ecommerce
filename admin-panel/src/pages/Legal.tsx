import { useState, useEffect } from 'react';
import { FileText, Save, Eye, Edit2, Shield, ScrollText } from 'lucide-react';
import toast from 'react-hot-toast';
import { contentAPI } from '../services/api';

interface LegalContent {
  privacy_policy: string;
  terms_conditions: string;
  last_updated: string;
}

export default function Legal() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<LegalContent>({
    privacy_policy: '',
    terms_conditions: '',
    last_updated: new Date().toISOString(),
  });
  const [editedContent, setEditedContent] = useState<LegalContent>({
    privacy_policy: '',
    terms_conditions: '',
    last_updated: '',
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await contentAPI.getByType('legal');
      if (response.data) {
        setContent(response.data);
        setEditedContent(response.data);
      } else {
        // Set default content if none exists
        const defaultContent = {
          privacy_policy: getDefaultPrivacyPolicy(),
          terms_conditions: getDefaultTermsConditions(),
          last_updated: new Date().toISOString(),
        };
        setContent(defaultContent);
        setEditedContent(defaultContent);
      }
    } catch (error) {
      console.error('Error fetching legal content:', error);
      // Set default content on error
      const defaultContent = {
        privacy_policy: getDefaultPrivacyPolicy(),
        terms_conditions: getDefaultTermsConditions(),
        last_updated: new Date().toISOString(),
      };
      setContent(defaultContent);
      setEditedContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedContent = {
        ...editedContent,
        last_updated: new Date().toISOString(),
      };
      
      await contentAPI.update('legal', updatedContent);
      
      setContent(updatedContent);
      setEditMode(false);
      toast.success('Legal content updated successfully');
    } catch (error) {
      toast.error('Failed to update legal content');
      console.error('Error updating legal content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setEditMode(false);
  };

  const getDefaultPrivacyPolicy = () => {
    return `# Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

## 1. Information We Collect

### Personal Information
- Name and contact information
- Billing and shipping addresses
- Payment information (processed securely)
- Order history and preferences
- Account credentials

### Automatically Collected Information
- IP address and browser information
- Device information
- Browsing behavior
- Cookies and tracking technologies

## 2. How We Use Your Information
- Process and fulfill orders
- Send order confirmations
- Respond to customer inquiries
- Personalize shopping experience
- Send promotional emails (with consent)
- Improve our services
- Prevent fraud
- Comply with legal obligations

## 3. Information Sharing
We do not sell your personal information. We may share with:
- Payment processors
- Shipping partners
- Service providers
- Law enforcement when required

## 4. Data Security
We implement appropriate measures to protect your information:
- SSL encryption
- Secure payment processing
- Regular security audits
- Limited access controls

## 5. Your Rights
- Access your information
- Correct or update data
- Request deletion
- Opt-out of marketing
- Lodge complaints

## 6. Contact Us
Email: privacy@tripundlifestyle.com
Phone: +91 98765 43210
Address: Mumbai, Maharashtra, India`;
  };

  const getDefaultTermsConditions = () => {
    return `# Terms & Conditions

Last updated: ${new Date().toLocaleDateString()}

## 1. General Terms
- Must be 18+ to use our services
- Maintain account confidentiality
- Provide accurate information
- We reserve the right to refuse service

## 2. Products and Services
- Accurate product descriptions
- Colors may vary on different monitors
- We reserve the right to limit quantities
- Products subject to availability
- Handcrafted items may have variations

## 3. Pricing and Payment
- Prices in INR including taxes
- Payment through Razorpay
- Full payment before processing
- Prices subject to change
- Promotions cannot be combined

## 4. Shipping and Delivery
- Ship within India
- Charges based on order value and location
- Estimated times not guaranteed
- Risk passes upon delivery
- Not responsible for carrier delays

## 5. Returns and Refunds
- 7-day return window
- Unused items in original packaging
- No returns on custom items
- Customer pays return shipping
- Refunds in 7-10 business days

## 6. Cancellations
- Within 24 hours of placement
- Cannot cancel shipped orders
- No cancellation for custom orders
- Contact customer service

## 7. Intellectual Property
All content is property of TRIPUND Lifestyle and protected by law.

## 8. Limitation of Liability
We are not liable for indirect damages. Total liability limited to amount paid.

## 9. Governing Law
Governed by laws of India. Disputes subject to Mumbai jurisdiction.

## 10. Contact Information
Email: support@tripundlifestyle.com
Phone: +91 98765 43210
Address: Mumbai, Maharashtra, India`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading legal content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legal Documents</h1>
          <p className="text-gray-600">Manage privacy policy and terms & conditions</p>
        </div>
        <div className="flex items-center space-x-3">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center space-x-2 admin-button"
            >
              <Edit2 size={20} />
              <span>Edit Content</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 admin-button"
              >
                <Save size={20} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-6 py-4 flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'privacy'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield size={20} />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-6 py-4 flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'terms'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <ScrollText size={20} />
              <span>Terms & Conditions</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {content.last_updated && (
            <div className="mb-4 text-sm text-gray-500">
              Last updated: {new Date(content.last_updated).toLocaleDateString()}
            </div>
          )}

          {editMode ? (
            <div>
              <textarea
                value={activeTab === 'privacy' ? editedContent.privacy_policy : editedContent.terms_conditions}
                onChange={(e) => {
                  if (activeTab === 'privacy') {
                    setEditedContent({ ...editedContent, privacy_policy: e.target.value });
                  } else {
                    setEditedContent({ ...editedContent, terms_conditions: e.target.value });
                  }
                }}
                className="w-full h-[600px] px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={`Enter ${activeTab === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'} content...`}
              />
              <p className="mt-2 text-sm text-gray-500">
                You can use Markdown formatting for better presentation
              </p>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-gray-700">
                  {activeTab === 'privacy' ? content.privacy_policy : content.terms_conditions}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Links */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Preview Links</h3>
        <div className="flex space-x-4">
          <a
            href="https://tripundlifestyle.netlify.app/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
          >
            <Eye size={16} />
            <span>View Privacy Policy</span>
          </a>
          <a
            href="https://tripundlifestyle.netlify.app/terms-conditions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
          >
            <Eye size={16} />
            <span>View Terms & Conditions</span>
          </a>
        </div>
      </div>
    </div>
  );
}