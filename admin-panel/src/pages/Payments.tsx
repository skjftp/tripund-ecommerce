import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { paymentAPI } from '../services/api';

interface Payment {
  id: string;
  transaction_id: string;
  order_id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  method: 'razorpay' | 'cod' | 'bank_transfer' | 'wallet';
  status: 'success' | 'pending' | 'failed' | 'refunded' | 'processing';
  type: 'payment' | 'refund' | 'partial_refund';
  gateway_response?: {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };
  refund_details?: {
    amount: number;
    reason: string;
    initiated_at: string;
  };
  created_at: string;
  updated_at: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('today');

  useEffect(() => {
    const mockPayments: Payment[] = [
      {
        id: '1',
        transaction_id: 'TXN123456789',
        order_id: 'ORD-2024-001',
        customer: {
          id: '1',
          name: 'Rahul Sharma',
          email: 'rahul@example.com',
        },
        amount: 10030,
        currency: 'INR',
        method: 'razorpay',
        status: 'success',
        type: 'payment',
        gateway_response: {
          razorpay_payment_id: 'pay_123456',
          razorpay_order_id: 'order_123456',
          razorpay_signature: 'sig_123456',
        },
        created_at: '2024-01-20T10:30:00Z',
        updated_at: '2024-01-20T10:30:00Z',
      },
      {
        id: '2',
        transaction_id: 'TXN123456790',
        order_id: 'ORD-2024-002',
        customer: {
          id: '2',
          name: 'Priya Patel',
          email: 'priya@example.com',
        },
        amount: 7170,
        currency: 'INR',
        method: 'cod',
        status: 'pending',
        type: 'payment',
        created_at: '2024-01-21T14:00:00Z',
        updated_at: '2024-01-21T14:00:00Z',
      },
      {
        id: '3',
        transaction_id: 'TXN123456791',
        order_id: 'ORD-2024-003',
        customer: {
          id: '3',
          name: 'Amit Kumar',
          email: 'amit@example.com',
        },
        amount: 5600,
        currency: 'INR',
        method: 'razorpay',
        status: 'success',
        type: 'payment',
        gateway_response: {
          razorpay_payment_id: 'pay_123457',
          razorpay_order_id: 'order_123457',
          razorpay_signature: 'sig_123457',
        },
        created_at: '2024-01-19T11:00:00Z',
        updated_at: '2024-01-19T11:00:00Z',
      },
      {
        id: '4',
        transaction_id: 'TXN123456792',
        order_id: 'ORD-2024-001',
        customer: {
          id: '1',
          name: 'Rahul Sharma',
          email: 'rahul@example.com',
        },
        amount: 2000,
        currency: 'INR',
        method: 'razorpay',
        status: 'refunded',
        type: 'partial_refund',
        refund_details: {
          amount: 2000,
          reason: 'Product damaged',
          initiated_at: '2024-01-22T10:00:00Z',
        },
        created_at: '2024-01-22T10:00:00Z',
        updated_at: '2024-01-22T10:05:00Z',
      },
      {
        id: '5',
        transaction_id: 'TXN123456793',
        order_id: 'ORD-2024-004',
        customer: {
          id: '4',
          name: 'Sneha Reddy',
          email: 'sneha@example.com',
        },
        amount: 12000,
        currency: 'INR',
        method: 'razorpay',
        status: 'failed',
        type: 'payment',
        created_at: '2024-01-19T16:00:00Z',
        updated_at: '2024-01-19T16:00:00Z',
      },
    ];
    setPayments(mockPayments);
    setLoading(false);
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = selectedMethod === 'all' || payment.method === selectedMethod;
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />;
      case 'failed':
        return <XCircle className="text-red-500" size={16} />;
      case 'refunded':
        return <RefreshCw className="text-gray-500" size={16} />;
      case 'processing':
        return <AlertCircle className="text-blue-500" size={16} />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowDownLeft className="text-green-500" size={16} />;
      case 'refund':
      case 'partial_refund':
        return <ArrowUpRight className="text-red-500" size={16} />;
      default:
        return null;
    }
  };

  const stats = {
    totalRevenue: payments
      .filter(p => p.status === 'success' && p.type === 'payment')
      .reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
    refundedAmount: payments
      .filter(p => p.type === 'refund' || p.type === 'partial_refund')
      .reduce((sum, p) => sum + p.amount, 0),
    successRate: (
      (payments.filter(p => p.status === 'success').length / payments.length) * 100
    ).toFixed(1),
  };

  const handleRefund = async (paymentId: string) => {
    if (window.confirm('Are you sure you want to initiate a refund?')) {
      try {
        toast.success('Refund initiated successfully');
      } catch (error) {
        toast.error('Failed to initiate refund');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track and manage all payment transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw size={20} />
            <span>Sync</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={20} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(stats.totalRevenue / 1000).toFixed(1)}k
              </p>
            </div>
            <DollarSign className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(stats.pendingAmount / 1000).toFixed(1)}k
              </p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Refunded</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(stats.refundedAmount / 1000).toFixed(1)}k
              </p>
            </div>
            <RefreshCw className="text-red-600" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
            </div>
            <TrendingUp className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Methods</option>
            <option value="razorpay">Razorpay</option>
            <option value="cod">Cash on Delivery</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="wallet">Wallet</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="processing">Processing</option>
          </select>
          
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          
          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            <span>More</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Loading payments...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(payment.type)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.transaction_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          Order: {payment.order_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.type === 'refund' || payment.type === 'partial_refund' ? '-' : ''}
                      ₹{payment.amount.toLocaleString()}
                    </div>
                    {payment.type === 'partial_refund' && (
                      <div className="text-xs text-gray-500">Partial refund</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CreditCard size={14} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 capitalize">
                        {payment.method === 'cod' ? 'COD' : payment.method}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(payment.status)}
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(payment.created_at), 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                      {payment.status === 'success' && payment.type === 'payment' && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleRefund(payment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Refund
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}