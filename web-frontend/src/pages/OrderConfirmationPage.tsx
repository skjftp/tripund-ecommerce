import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { clearCartWithSync } from '../store/slices/cartSlice';
import { AppDispatch } from '../store';
import api from '../services/api';

interface Order {
  id: string;
  order_number: string;
  status: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  payment: {
    status: string;
    method: string;
    razorpay_payment_id?: string;
  };
  created_at: string;
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProcessing, setShowProcessing] = useState(true);

  useEffect(() => {
    // Clear cart when order confirmation page loads
    dispatch(clearCartWithSync());
    
    // Show processing animation for 2 seconds before fetching order
    const timer = setTimeout(() => {
      setShowProcessing(false);
      fetchOrder();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [orderId, dispatch]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  if (showProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-primary-600 mx-auto"></div>
            <CheckCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-primary-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mt-6 mb-2">Processing Your Order</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="text-center mb-8">
            <div className="animate-in fade-in duration-500">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-in zoom-in duration-700" />
            </div>
            <h1 className="text-3xl font-bold mb-2 animate-in slide-in-from-bottom duration-500">Order Confirmed!</h1>
            <p className="text-gray-600 mb-4 animate-in slide-in-from-bottom duration-700 delay-200">
              Thank you for your purchase. Your order is being processed and will be delivered shortly.
            </p>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="text-2xl font-bold text-primary-600">{order.order_number}</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            
            {/* Customer Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-3 flex items-center">
                  <Mail className="mr-2" size={18} />
                  Contact Information
                </h3>
                <div className="text-gray-600 space-y-1">
                  <p>{order.customer.name}</p>
                  <p>{order.customer.email}</p>
                  <p className="flex items-center">
                    <Phone size={14} className="mr-1" />
                    {order.customer.phone}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 flex items-center">
                  <MapPin className="mr-2" size={18} />
                  Shipping Address
                </h3>
                <div className="text-gray-600 space-y-1">
                  <p>{order.shipping_address.line1}</p>
                  {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                  <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                  <p>{order.shipping_address.postal_code}, {order.shipping_address.country}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4 flex items-center">
                <Package className="mr-2" size={18} />
                Order Items
              </h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-6 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{order.totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>₹{order.totals.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>₹{order.totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>₹{order.totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="border-t pt-6 mt-6">
              <h3 className="font-medium mb-3">Payment Information</h3>
              <div className="text-gray-600 space-y-1">
                <p>Payment Method: <span className="capitalize">{order.payment.method}</span></p>
                <p>Payment Status: <span className="text-green-600 font-medium capitalize">{order.payment.status}</span></p>
                {order.payment.razorpay_payment_id && (
                  <p className="text-sm">Transaction ID: {order.payment.razorpay_payment_id}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-3">What's Next?</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              You will receive an order confirmation email shortly
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              We'll notify you when your order ships
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Track your order status in your account
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/orders"
            className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            View My Orders
          </Link>
          <Link
            to="/products"
            className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Continue Shopping
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}