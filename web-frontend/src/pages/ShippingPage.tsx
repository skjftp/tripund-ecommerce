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
      setContent(response.data?.data || getDefaultContent());
    } catch (error) {
      console.error('Failed to fetch shipping content:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => ({
    title: 'Shipping Information',
    description: 'We deliver across India with care and efficiency',
    zones: [
      {
        name: 'Metro Cities',
        cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'],
        delivery_time: '3-5 business days',
        shipping_charge: 'Free for orders above ₹999',
      },
      {
        name: 'Other Cities',
        cities: ['Tier 2 and Tier 3 cities'],
        delivery_time: '5-7 business days',
        shipping_charge: '₹99 (Free for orders above ₹1499)',
      },
      {
        name: 'Remote Areas',
        cities: ['North East states', 'J&K', 'Andaman & Nicobar', 'Lakshadweep'],
        delivery_time: '7-10 business days',
        shipping_charge: '₹199 (Free for orders above ₹2499)',
      },
    ],
    process: [
      {
        step: 1,
        title: 'Order Processing',
        description: 'Your order is confirmed and prepared for shipping',
        duration: '1-2 business days',
      },
      {
        step: 2,
        title: 'Quality Check',
        description: 'Each item is inspected for quality and carefully packed',
        duration: '1 business day',
      },
      {
        step: 3,
        title: 'Dispatch',
        description: 'Your order is handed over to our shipping partner',
        duration: 'Same day',
      },
      {
        step: 4,
        title: 'In Transit',
        description: 'Your package is on its way to you',
        duration: 'Varies by location',
      },
      {
        step: 5,
        title: 'Delivery',
        description: 'Your order is delivered to your doorstep',
        duration: 'As per schedule',
      },
    ],
    policies: [
      'All orders are processed within 1-2 business days',
      'Shipping charges are calculated based on order value and delivery location',
      'Free shipping thresholds vary by delivery zone',
      'Tracking information is provided via email and SMS',
      'Signature may be required for high-value orders',
      'Multiple attempts will be made for delivery',
      'Undelivered orders will be returned after 7 days',
    ],
    tracking_info: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can track your order using this number on our website or the courier partner\'s website.',
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
          <p className="text-gray-600 text-lg">{shippingContent.description}</p>
        </div>

        {/* Shipping Zones */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <MapPin className="mr-2 text-primary-600" size={24} />
            Delivery Zones & Charges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shippingContent.zones.map((zone: any, index: number) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-3">{zone.name}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Coverage</p>
                    <p className="text-gray-700">
                      {Array.isArray(zone.cities) ? zone.cities.join(', ') : zone.cities}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Time</p>
                    <p className="text-gray-700 flex items-center">
                      <Clock size={16} className="mr-1 text-primary-600" />
                      {zone.delivery_time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Shipping Charge</p>
                    <p className="text-primary-600 font-medium">{zone.shipping_charge}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Package className="mr-2 text-primary-600" size={24} />
            Shipping Process
          </h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="relative">
              {shippingContent.process.map((step: any, index: number) => (
                <div key={step.step} className="flex items-start mb-8 last:mb-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {step.step}
                    </div>
                    {index < shippingContent.process.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-300 mx-5 mt-2"></div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <p className="text-gray-600 mt-1">{step.description}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
                      {step.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tracking Information */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Truck className="mr-2 text-primary-600" size={24} />
            Order Tracking
          </h2>
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-start">
              <Info className="text-blue-600 mr-3 flex-shrink-0 mt-1" size={20} />
              <p className="text-gray-700">{shippingContent.tracking_info}</p>
            </div>
          </div>
        </div>

        {/* Shipping Policies */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Shipping Policies</h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <ul className="space-y-3">
              {shippingContent.policies.map((policy: string, index: number) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="text-green-600 mr-3 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-700">{policy}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 rounded-lg p-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <Info className="text-yellow-600 mr-2" size={20} />
            Important Notes
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Delivery times are estimates and may vary due to unforeseen circumstances</li>
            <li>• Orders placed on weekends and holidays will be processed on the next business day</li>
            <li>• For bulk orders, please contact our customer service for special shipping arrangements</li>
            <li>• International shipping is currently not available</li>
          </ul>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Have questions about shipping?</p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Contact Customer Support
          </a>
        </div>
      </div>
    </div>
  );
}