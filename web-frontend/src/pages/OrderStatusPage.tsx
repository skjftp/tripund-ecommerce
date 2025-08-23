import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, XCircle, CheckCircle, RefreshCw, CreditCard } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment: {
    status: string;
    razorpay_order_id?: string;
  };
  totals: {
    total: number;
  };
  created_at: string;
}

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    fetchOrderStatus();
    // Poll for payment status every 5 seconds if payment is pending
    const interval = paymentStatus === 'pending' ? setInterval(fetchOrderStatus, 5000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [orderId]);

  const fetchOrderStatus = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);
      
      // If payment is completed, redirect to confirmation page
      if (response.data.order.payment?.status === 'completed') {
        navigate(`/order-confirmation/${orderId}`);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to fetch order status');
    } finally {
      setLoading(false);
    }
  };

  const retryPayment = async () => {
    if (!order) return;
    
    setRetrying(true);
    try {
      // Create new Razorpay order for retry
      const response = await api.post('/payment/create-order', {
        amount: order.totals.total,
        currency: 'INR',
        order_id: order.id,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_xxxxx',
        amount: order.totals.total * 100,
        currency: 'INR',
        name: 'TRIPUND Lifestyle',
        description: 'Artisan Marketplace Purchase',
        order_id: response.data.order_id,
        handler: async function (response: any) {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.id,
            });

            toast.success('Payment successful!');
            navigate(`/order-confirmation/${order.id}`);
          } catch (error) {
            toast.error('Payment verification failed');
            fetchOrderStatus();
          }
        },
        modal: {
          ondismiss: function() {
            toast('Payment cancelled');
            setRetrying(false);
          }
        },
        theme: {
          color: '#d4a574',
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-gray-600">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (order.payment?.status === 'completed') {
      return <CheckCircle className="w-16 h-16 text-green-500" />;
    } else if (order.payment?.status === 'failed' || paymentStatus === 'failed') {
      return <XCircle className="w-16 h-16 text-red-500" />;
    } else {
      return <Clock className="w-16 h-16 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    if (order.payment?.status === 'completed') {
      return {
        title: 'Payment Successful!',
        message: 'Your payment has been processed successfully.',
      };
    } else if (order.payment?.status === 'failed' || paymentStatus === 'failed') {
      return {
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again.',
      };
    } else {
      return {
        title: 'Payment Pending',
        message: 'Your order has been created but payment is pending. You can complete the payment now or later.',
      };
    }
  };

  const status = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            {getStatusIcon()}
            <h1 className="text-3xl font-bold mt-4 mb-2">{status.title}</h1>
            <p className="text-gray-600">{status.message}</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-medium">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-medium">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">₹{order.totals.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`font-medium capitalize ${
                  order.payment?.status === 'completed' ? 'text-green-600' :
                  order.payment?.status === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {order.payment?.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {(order.payment?.status !== 'completed') && (
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={retryPayment}
                disabled={retrying}
                className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {retrying ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2" size={20} />
                    Complete Payment
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                View My Orders
              </button>
            </div>
          )}

          {order.payment?.status === 'completed' && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => navigate(`/order-confirmation/${order.id}`)}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                View Order Confirmation
              </button>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            {order.payment?.status === 'pending' && (
              <p>
                <RefreshCw className="inline mr-1" size={14} />
                Checking payment status automatically...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}