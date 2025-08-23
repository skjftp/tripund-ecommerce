import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Package, Clock, CheckCircle, Truck, 
  AlertCircle, ChevronRight, Calendar, MapPin, CreditCard, Phone 
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

        <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-md capitalize whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
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
                <div key={order.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                    <div className="mb-3 sm:mb-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-0">
                          Order #{order.order_number}
                        </h3>
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${statusClass} self-start sm:self-auto`}>
                          <StatusIcon size={14} className="mr-1" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {formatDate(order.created_at)}
                        </span>
                        <span className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          {formatTime(order.created_at)}
                        </span>
                        <span className="flex items-center">
                          <CreditCard size={12} className="mr-1" />
                          {order.payment.method === 'razorpay' ? 'Online' : 'COD'}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xl sm:text-2xl font-bold text-primary-600">
                        ₹{order.totals.total.toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-b py-3 sm:py-4 mb-3 sm:mb-4">
                    <div className="space-y-3">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.product_id} className="flex items-center space-x-3 sm:space-x-4">
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate">{item.product_name}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-medium text-sm sm:text-base">₹{item.total.toLocaleString()}</p>
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

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <MapPin size={12} className="mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {order.shipping_address.city}, {order.shipping_address.state}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-primary-600 hover:text-primary-700 font-medium text-xs sm:text-sm px-3 py-1 border border-primary-600 rounded-md hover:bg-primary-50"
                      >
                        View Details
                      </button>
                      {order.status === 'delivered' && (
                        <button className="text-primary-600 hover:text-primary-700 font-medium text-xs sm:text-sm px-3 py-1 border border-primary-600 rounded-md hover:bg-primary-50">
                          Write Review
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button className="text-red-600 hover:text-red-700 font-medium text-xs sm:text-sm px-3 py-1 border border-red-600 rounded-md hover:bg-red-50">
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
              <div className="sticky top-0 bg-white p-6 border-b z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Order Details</h2>
                    <p className="text-gray-600">Order #{selectedOrder.order_number}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700 p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Order Status */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const StatusIcon = statusIcons[selectedOrder.status];
                      const statusClass = statusColors[selectedOrder.status];
                      return (
                        <>
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusClass}`}>
                            <StatusIcon size={18} className="mr-2" />
                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                          </span>
                          <span className="text-gray-600">
                            Ordered on {formatDate(selectedOrder.created_at)} at {formatTime(selectedOrder.created_at)}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Tracking Info */}
                {selectedOrder.tracking && (selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2">Tracking Information</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Carrier:</span> {selectedOrder.tracking.provider}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Tracking Number:</span> {selectedOrder.tracking.number}
                        </p>
                        {selectedOrder.tracking.shipped_at && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Shipped:</span> {formatDate(selectedOrder.tracking.shipped_at)}
                          </p>
                        )}
                        {selectedOrder.tracking.delivered_at && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Delivered:</span> {formatDate(selectedOrder.tracking.delivered_at)}
                          </p>
                        )}
                      </div>
                      {selectedOrder.tracking.url && (
                        <a
                          href={selectedOrder.tracking.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Track Package →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-4">Order Items ({selectedOrder.items.length})</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.product_id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">SKU: {item.sku}</p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} × ₹{item.price.toLocaleString()}
                            </p>
                            <p className="font-semibold">₹{item.total.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-3">Shipping Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedOrder.shipping_address.line1}</p>
                      {selectedOrder.shipping_address.line2 && (
                        <p className="text-gray-700">{selectedOrder.shipping_address.line2}</p>
                      )}
                      <p className="text-gray-700">
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}
                      </p>
                      <p className="text-gray-700">
                        {selectedOrder.shipping_address.postal_code}, {selectedOrder.shipping_address.country}
                      </p>
                      {selectedOrder.shipping_address.phone && (
                        <p className="text-gray-700 mt-2">
                          <Phone size={14} className="inline mr-1" />
                          {selectedOrder.shipping_address.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Billing Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedOrder.billing_address.line1}</p>
                      {selectedOrder.billing_address.line2 && (
                        <p className="text-gray-700">{selectedOrder.billing_address.line2}</p>
                      )}
                      <p className="text-gray-700">
                        {selectedOrder.billing_address.city}, {selectedOrder.billing_address.state}
                      </p>
                      <p className="text-gray-700">
                        {selectedOrder.billing_address.postal_code}, {selectedOrder.billing_address.country}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment & Order Summary */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Payment Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">
                        <span className="font-medium">Method:</span> {selectedOrder.payment.method === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-2 ${selectedOrder.payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {selectedOrder.payment.status.charAt(0).toUpperCase() + selectedOrder.payment.status.slice(1)}
                        </span>
                      </p>
                      {selectedOrder.payment.transaction_id && (
                        <p className="text-gray-700">
                          <span className="font-medium">Transaction ID:</span> {selectedOrder.payment.transaction_id}
                        </p>
                      )}
                      {selectedOrder.payment.paid_at && (
                        <p className="text-gray-700">
                          <span className="font-medium">Paid on:</span> {formatDate(selectedOrder.payment.paid_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Order Summary</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between text-gray-700">
                          <span>Subtotal</span>
                          <span>₹{selectedOrder.totals.subtotal.toLocaleString()}</span>
                        </div>
                        {selectedOrder.totals.discount > 0 && (
                          <div className="flex justify-between text-gray-700">
                            <span>Discount</span>
                            <span className="text-green-600">-₹{selectedOrder.totals.discount.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedOrder.totals.coupon_amount > 0 && (
                          <div className="flex justify-between text-gray-700">
                            <span>Coupon ({selectedOrder.totals.coupon_code})</span>
                            <span className="text-green-600">-₹{selectedOrder.totals.coupon_amount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-700">
                          <span>Tax</span>
                          <span>₹{selectedOrder.totals.tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Shipping</span>
                          <span>{selectedOrder.totals.shipping === 0 ? 'FREE' : `₹${selectedOrder.totals.shipping.toLocaleString()}`}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span className="text-primary-600">₹{selectedOrder.totals.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  {selectedOrder.status === 'delivered' && (
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                      Write a Review
                    </button>
                  )}
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
                    <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                      Cancel Order
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}