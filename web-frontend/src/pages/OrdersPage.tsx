import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Package, Clock, CheckCircle, Truck, 
  AlertCircle, ChevronRight, Calendar, MapPin, CreditCard 
} from 'lucide-react';
import { RootState } from '../store';
import api from '../services/api';
import { Order } from '../types';

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle,
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-100',
  processing: 'text-blue-600 bg-blue-100',
  shipped: 'text-purple-600 bg-purple-100',
  delivered: 'text-green-600 bg-green-100',
  cancelled: 'text-red-600 bg-red-100',
};

const sampleOrders: Order[] = [
  {
    id: 'ORD001',
    order_number: 'TRP-2024-001',
    user_id: 'user123',
    items: [
      {
        product_id: 'faith-in-form-crucifix',
        product_name: '"Faith in Form" – Handcrafted Wall Crucifix',
        product_image: 'https://images.unsplash.com/photo-1548357019-59232d5317c9?w=800',
        sku: 'FIF-CRX-001',
        quantity: 1,
        price: 8150,
        discount: 0,
        total: 8150,
      },
    ],
    shipping_address: {
      id: 'addr1',
      type: 'home',
      line1: '123 Main Street',
      line2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      country: 'India',
      phone: '+91 98765 43210',
      is_default: true,
    },
    billing_address: {
      id: 'addr1',
      type: 'home',
      line1: '123 Main Street',
      line2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      country: 'India',
      phone: '+91 98765 43210',
      is_default: true,
    },
    payment: {
      method: 'razorpay',
      status: 'completed',
      transaction_id: 'pay_123456789',
      razorpay_order_id: 'order_123456789',
      razorpay_payment_id: 'pay_123456789',
      razorpay_signature: 'sig_123456789',
      amount: 8150,
      currency: 'INR',
      paid_at: '2024-01-15T10:30:00Z',
    },
    totals: {
      subtotal: 8150,
      discount: 0,
      tax: 1467,
      shipping: 0,
      total: 9617,
      coupon_code: '',
      coupon_amount: 0,
    },
    status: 'delivered',
    tracking: {
      provider: 'BlueDart',
      number: 'BD123456789IN',
      url: 'https://bluedart.com/track/BD123456789IN',
      shipped_at: '2024-01-16T08:00:00Z',
      delivered_at: '2024-01-18T14:30:00Z',
      status: 'delivered',
    },
    notes: '',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-18T14:30:00Z',
  },
  {
    id: 'ORD002',
    order_number: 'TRP-2024-002',
    user_id: 'user123',
    items: [
      {
        product_id: 'owl-guardian-key-rack',
        product_name: '"Owl Guardian" – Handcrafted Recycled Metal Key Rack',
        product_image: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800',
        sku: 'OWL-KEY-001',
        quantity: 2,
        price: 5900,
        discount: 0,
        total: 11800,
      },
    ],
    shipping_address: {
      id: 'addr1',
      type: 'home',
      line1: '123 Main Street',
      line2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      country: 'India',
      phone: '+91 98765 43210',
      is_default: true,
    },
    billing_address: {
      id: 'addr1',
      type: 'home',
      line1: '123 Main Street',
      line2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      country: 'India',
      phone: '+91 98765 43210',
      is_default: true,
    },
    payment: {
      method: 'razorpay',
      status: 'completed',
      transaction_id: 'pay_987654321',
      razorpay_order_id: 'order_987654321',
      razorpay_payment_id: 'pay_987654321',
      razorpay_signature: 'sig_987654321',
      amount: 11800,
      currency: 'INR',
      paid_at: '2024-01-20T15:45:00Z',
    },
    totals: {
      subtotal: 11800,
      discount: 0,
      tax: 2124,
      shipping: 0,
      total: 13924,
      coupon_code: '',
      coupon_amount: 0,
    },
    status: 'shipped',
    tracking: {
      provider: 'FedEx',
      number: 'FX987654321IN',
      url: 'https://fedex.com/track/FX987654321IN',
      shipped_at: '2024-01-22T09:00:00Z',
      delivered_at: '',
      status: 'in_transit',
    },
    notes: '',
    created_at: '2024-01-20T15:30:00Z',
    updated_at: '2024-01-22T09:00:00Z',
  },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      // Handle both empty array and actual orders
      const fetchedOrders = response.data.orders || [];
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Don't use sample data - show actual state
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-md capitalize ${
                filterStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={64} />
            <h2 className="text-2xl font-bold mb-2">No orders found</h2>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all' 
                ? "You haven't placed any orders yet." 
                : `No ${filterStatus} orders found.`}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
            >
              Start Shopping
              <ChevronRight className="ml-2" size={20} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status];
              const statusClass = statusColors[order.status];
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          Order #{order.order_number}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${statusClass}`}>
                          <StatusIcon size={16} className="mr-1" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(order.created_at)}
                        </span>
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {formatTime(order.created_at)}
                        </span>
                        <span className="flex items-center">
                          <CreditCard size={14} className="mr-1" />
                          {order.payment.method === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        ₹{order.totals.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-b py-4 mb-4">
                    <div className="space-y-3">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.product_id} className="flex items-center space-x-4">
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-medium">₹{item.total.toLocaleString()}</p>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-600">
                          +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {order.tracking && order.status === 'shipped' && (
                    <div className="bg-blue-50 p-4 rounded-md mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Tracking Information
                          </p>
                          <p className="text-sm text-blue-700">
                            {order.tracking.provider}: {order.tracking.number}
                          </p>
                        </div>
                        <a
                          href={order.tracking.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Track Package →
                        </a>
                      </div>
                    </div>
                  )}

                  {order.status === 'delivered' && order.tracking?.delivered_at && (
                    <div className="bg-green-50 p-4 rounded-md mb-4">
                      <p className="text-sm font-medium text-green-900">
                        Delivered on {formatDate(order.tracking.delivered_at)}
                      </p>
                      <p className="text-sm text-green-700">
                        Your order was successfully delivered
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={14} className="mr-1" />
                      <span>
                        {order.shipping_address.city}, {order.shipping_address.state}
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                      {order.status === 'delivered' && (
                        <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                          Write Review
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Order details content would go here */}
                <p className="text-gray-600">Full order details view coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}