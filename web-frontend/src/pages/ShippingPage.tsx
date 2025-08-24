import { useEffect, useState } from 'react';
import { Truck, Clock, MapPin, Package, Info, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function ShippingPage() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/content/shipping');
      setContent(response.data || getDefaultContent());
    } catch (error) {
      console.error('Failed to fetch shipping content:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => ({
    title: 'Shipping Information',
    subtitle: 'We deliver handcrafted treasures across India',
    deliveryTime: '5-7 business days for most locations',
    zones: [
      { zone: 'Metro Cities', delivery: '3-5 days', charges: 'Free above ₹2000' },
      { zone: 'Tier 1 Cities', delivery: '5-7 days', charges: '₹100' },
      { zone: 'Tier 2/3 Cities', delivery: '7-10 days', charges: '₹150' },
      { zone: 'Remote Areas', delivery: '10-15 days', charges: '₹200' },
    ],
    freeShippingThreshold: 2000,
    expressShipping: {
      available: true,
      charges: 200,
      delivery: '2-3 business days',
    },
    trackingInfo: 'You will receive tracking details via email and SMS once your order is dispatched.',
    packagingNote: 'All items are carefully packaged to ensure they reach you in perfect condition.',
    restrictions: ['We currently ship only within India', 'P.O. Box addresses are not accepted'],
    contactSupport: 'For shipping queries, contact us at shipping@tripundlifestyle.com',
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipping information...</p>
        </div>
      </div>
    );
  }

  const shippingContent = content || getDefaultContent();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">{shippingContent.title}</h1>
          <p className="text-gray-600 text-lg">{shippingContent.subtitle}</p>
          <p className="text-primary-600 font-medium mt-2">
            Standard Delivery: {shippingContent.deliveryTime}
          </p>
        </div>

        {/* Shipping Zones */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <MapPin className="mr-2 text-primary-600" size={24} />
            Delivery Zones & Charges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shippingContent.zones?.map((zone: any, index: number) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-3">{zone.zone}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Delivery Time</p>
                    <p className="text-gray-700 flex items-center">
                      <Clock size={16} className="mr-1 text-primary-600" />
                      {zone.delivery}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Shipping Charges</p>
                    <p className="text-primary-600 font-medium">{zone.charges}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {shippingContent.freeShippingThreshold && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">
                🎉 Free shipping on all orders above ₹{shippingContent.freeShippingThreshold}!
              </p>
            </div>
          )}
        </div>

        {/* Express Shipping */}
        {shippingContent.expressShipping?.available && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Truck className="mr-2 text-primary-600" size={24} />
              Express Shipping Available
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-blue-900">Need it faster?</p>
                  <p className="text-blue-700 mt-1">
                    Get your order in {shippingContent.expressShipping.delivery} with express shipping
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">₹{shippingContent.expressShipping.charges}</p>
                  <p className="text-sm text-blue-600">Additional charges</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Information */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Package className="mr-2 text-primary-600" size={24} />
            Order Tracking
          </h2>
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-start">
              <Info className="text-blue-600 mr-3 flex-shrink-0 mt-1" size={20} />
              <p className="text-gray-700">{shippingContent.trackingInfo}</p>
            </div>
          </div>
        </div>

        {/* Packaging */}
        {shippingContent.packagingNote && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Packaging & Care</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start">
                <CheckCircle className="text-green-600 mr-3 flex-shrink-0 mt-1" size={20} />
                <p className="text-gray-700">{shippingContent.packagingNote}</p>
              </div>
            </div>
          </div>
        )}

        {/* Restrictions */}
        {shippingContent.restrictions && shippingContent.restrictions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Shipping Restrictions</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <ul className="space-y-2">
                {shippingContent.restrictions.map((restriction: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <Info className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-700">{restriction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Contact Section */}
        {shippingContent.contactSupport && (
          <div className="mt-12 text-center bg-gray-50 rounded-lg p-8">
            <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
            <p className="text-gray-600 mb-4">{shippingContent.contactSupport}</p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Contact Customer Support
            </a>
          </div>
        )}
      </div>
    </div>
  );
}