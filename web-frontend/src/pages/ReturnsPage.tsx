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
      setContent(response.data?.data || getDefaultContent());
    } catch (error) {
      console.error('Failed to fetch returns content:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => ({
    title: 'Returns & Exchanges',
    description: 'We want you to love your purchase. If you\'re not completely satisfied, we\'re here to help.',
    return_window: '7 days',
    process: [
      {
        step: 1,
        title: 'Initiate Return',
        description: 'Contact us within 7 days of delivery with your order number and reason for return',
        icon: 'contact',
      },
      {
        step: 2,
        title: 'Approval',
        description: 'Our team will review your request and provide return authorization',
        icon: 'approval',
      },
      {
        step: 3,
        title: 'Pack & Ship',
        description: 'Pack the item securely in original packaging and ship to our return address',
        icon: 'pack',
      },
      {
        step: 4,
        title: 'Quality Check',
        description: 'We inspect the returned item for eligibility',
        icon: 'check',
      },
      {
        step: 5,
        title: 'Refund/Exchange',
        description: 'Refund processed within 7-10 business days or replacement shipped',
        icon: 'refund',
      },
    ],
    eligible_items: [
      'Unused products in original condition',
      'Items with original tags and packaging',
      'Products with manufacturing defects',
      'Wrong or damaged items received',
      'Items significantly different from description',
    ],
    non_eligible_items: [
      'Custom or personalized products',
      'Items marked as non-returnable',
      'Products damaged due to misuse',
      'Items without original packaging',
      'Products returned after 7 days',
      'Sale or discounted items (unless defective)',
    ],
    refund_policy: {
      timeline: '7-10 business days after inspection',
      methods: [
        'Original payment method for online payments',
        'Bank transfer for Cash on Delivery orders',
        'Store credit (valid for 6 months)',
      ],
      deductions: [
        'Return shipping costs (unless item is defective)',
        'Restocking fee for certain categories (if applicable)',
      ],
    },
    exchange_policy: {
      conditions: [
        'Subject to availability of replacement item',
        'Size/color exchanges for same product only',
        'One-time exchange per order',
        'Additional payment required if price difference exists',
      ],
      process_time: '5-7 business days after receiving returned item',
    },
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
          <p className="text-gray-600 text-lg">{returnsContent.description}</p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full">
            <Clock className="mr-2" size={18} />
            <span className="font-medium">Return Window: {returnsContent.return_window}</span>
          </div>
        </div>

        {/* Return Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <RotateCcw className="mr-2 text-primary-600" size={24} />
            Return Process
          </h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {returnsContent.process.map((step: any, index: number) => (
                <div key={step.step} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold">{step.step}</span>
                  </div>
                  {index < returnsContent.process.length - 1 && (
                    <div className="hidden md:block absolute ml-16 -mt-10 w-full">
                      <div className="h-0.5 bg-gray-300 w-3/4"></div>
                    </div>
                  )}
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
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
                {returnsContent.eligible_items.map((item: string, index: number) => (
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
                {returnsContent.non_eligible_items.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <XCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Refund Policy</h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-primary-600">Timeline</h3>
                <p className="text-gray-700">{returnsContent.refund_policy.timeline}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-primary-600">Refund Methods</h3>
                <ul className="space-y-2">
                  {returnsContent.refund_policy.methods.map((method: string, index: number) => (
                    <li key={index} className="text-gray-700">• {method}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-primary-600">Deductions</h3>
                <ul className="space-y-2">
                  {returnsContent.refund_policy.deductions.map((deduction: string, index: number) => (
                    <li key={index} className="text-gray-700">• {deduction}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Policy */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Exchange Policy</h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-4">
              <p className="text-primary-600 font-medium mb-2">Processing Time</p>
              <p className="text-gray-700">{returnsContent.exchange_policy.process_time}</p>
            </div>
            <div>
              <p className="text-primary-600 font-medium mb-3">Conditions</p>
              <ul className="space-y-2">
                {returnsContent.exchange_policy.conditions.map((condition: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <Package className="text-primary-600 mr-3 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-700">{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="mb-12 bg-yellow-50 rounded-lg p-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <AlertCircle className="text-yellow-600 mr-2" size={20} />
            Important Information
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Please ensure items are packed securely to avoid damage during return shipping</li>
            <li>• Include a copy of the original invoice with your return package</li>
            <li>• Take photos of the item before returning for your records</li>
            <li>• Keep the tracking number of your return shipment</li>
            <li>• Refunds do not include original shipping charges unless the return is due to our error</li>
          </ul>
        </div>

        {/* Return Address */}
        <div className="mb-12 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Return Address</h3>
          <div className="text-gray-700">
            <p className="font-medium">TRIPUND Lifestyle Returns Department</p>
            <p>123 Artisan Street, Andheri West</p>
            <p>Mumbai, Maharashtra 400058</p>
            <p>India</p>
            <p className="mt-3">
              <span className="font-medium">Phone:</span> +91 98765 43210
            </p>
            <p>
              <span className="font-medium">Email:</span> returns@tripundlifestyle.com
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Need help with your return?</p>
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
      </div>
    </div>
  );
}