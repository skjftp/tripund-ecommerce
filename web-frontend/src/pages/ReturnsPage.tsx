import { useEffect, useState } from 'react';
import { RotateCcw, Clock, Package, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

export default function ReturnsPage() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/content/returns');
      setContent(response.data || getDefaultContent());
    } catch (error) {
      console.error('Failed to fetch returns content:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => ({
    title: 'Returns & Exchanges',
    subtitle: 'Your satisfaction is our priority',
    returnWindow: '7 days',
    eligibleItems: [
      'Items in original condition with tags',
      'Unused and unwashed products',
      'Items with original packaging',
    ],
    nonReturnableItems: [
      'Customized or personalized products',
      'Items marked as final sale',
      'Digital gift cards',
      'Intimate apparel and jewelry',
    ],
    process: [
      'Initiate return request within 7 days of delivery',
      'Pack the item securely with all original tags',
      'Our courier partner will pick up the item',
      'Refund processed within 5-7 business days after inspection',
    ],
    exchangePolicy: 'Exchanges are available for size/color variations subject to availability.',
    refundMethods: [
      'Original payment method (5-7 days)',
      'Store credit (instant)',
      'Bank transfer (7-10 days)',
    ],
    damagePolicy: 'For damaged or defective items, report within 48 hours with photos for immediate resolution.',
    contactSupport: 'For returns & exchanges, email us at returns@tripundlifestyle.com',
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading returns information...</p>
        </div>
      </div>
    );
  }

  const returnsContent = content || getDefaultContent();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">{returnsContent.title}</h1>
          <p className="text-gray-600 text-lg">{returnsContent.subtitle}</p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full">
            <Clock className="mr-2" size={18} />
            <span className="font-medium">Return Window: {returnsContent.returnWindow}</span>
          </div>
        </div>

        {/* Return Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <RotateCcw className="mr-2 text-primary-600" size={24} />
            Return Process
          </h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="space-y-4">
              {returnsContent.process?.map((step: string, index: number) => (
                <div key={index} className="flex items-start">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <p className="ml-4 text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Eligibility */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CheckCircle className="mr-2 text-green-600" size={24} />
              Eligible for Return
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ul className="space-y-3">
                {returnsContent.eligibleItems?.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="text-green-600 mr-3 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <XCircle className="mr-2 text-red-600" size={24} />
              Not Eligible for Return
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ul className="space-y-3">
                {returnsContent.nonReturnableItems?.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <XCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Refund Methods */}
        {returnsContent.refundMethods && returnsContent.refundMethods.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Refund Methods</h2>
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {returnsContent.refundMethods.map((method: string, index: number) => (
                  <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <CheckCircle className="text-green-600 mr-3 flex-shrink-0" size={20} />
                    <span className="text-gray-700">{method}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Exchange Policy */}
        {returnsContent.exchangePolicy && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Exchange Policy</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start">
                <Package className="text-primary-600 mr-3 flex-shrink-0 mt-1" size={20} />
                <p className="text-gray-700">{returnsContent.exchangePolicy}</p>
              </div>
            </div>
          </div>
        )}

        {/* Damage Policy */}
        {returnsContent.damagePolicy && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Damaged or Defective Items</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="text-blue-600 mr-3 flex-shrink-0 mt-1" size={20} />
                <p className="text-gray-700">{returnsContent.damagePolicy}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Support */}
        {returnsContent.contactSupport && (
          <div className="mt-12 text-center bg-gray-50 rounded-lg p-8">
            <h3 className="text-lg font-semibold mb-3">Need Help with Returns?</h3>
            <p className="text-gray-600 mb-4">{returnsContent.contactSupport}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Contact Support
              </a>
              <a
                href="/faq"
                className="inline-block px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
              >
                View FAQs
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}