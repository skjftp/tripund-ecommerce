import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Users,
  Package,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Check,
  X,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
} from 'lucide-react';

interface StockRequest {
  id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  product_image?: string;
  user_id?: string;
  user_name: string;
  user_email?: string;
  user_phone: string;
  variant_color?: string;
  variant_size?: string;
  quantity: number;
  max_price?: number;
  notes?: string;
  status: 'pending' | 'contacted' | 'fulfilled' | 'cancelled';
  priority: number;
  admin_notes?: string;
  requested_at: string;
  contacted_at?: string;
  fulfilled_at?: string;
}

interface StockRequestSummary {
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image?: string;
  total_requests: number;
  pending_count: number;
  latest_request: string;
  request_details: Array<{
    id: string;
    user_name: string;
    user_phone: string;
    user_email?: string;
    quantity: number;
    variant_color?: string;
    variant_size?: string;
    requested_at: string;
    status: string;
  }>;
}

interface AdminStockRequestResponse {
  total_requests: number;
  pending_requests: number;
  product_summaries: StockRequestSummary[];
  recent_requests: StockRequest[];
}

export default function StockRequests() {
  const [data, setData] = useState<AdminStockRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'requests'>('summary');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchStockRequests();
  }, [selectedStatus]);

  const fetchStockRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/admin/stock-requests?status=${selectedStatus}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching stock requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string, adminNotes?: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/admin/stock-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          status: status,
          admin_notes: adminNotes || '',
          priority: 3,
        }),
      });

      if (response.ok) {
        fetchStockRequests();
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Requests</h1>
          <p className="text-gray-600">Manage customer requests for out-of-stock products</p>
        </div>
      </div>

      {/* Quick Stats */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_requests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{data.pending_requests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Products Requested</p>
                <p className="text-2xl font-bold text-gray-900">{data.product_summaries.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'summary', label: 'Product Summary' },
            { key: 'requests', label: 'All Requests' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'summary' && data && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Most Requested Products</h3>
              <p className="text-sm text-gray-500">Sorted by demand</p>
            </div>

            {data.product_summaries.length > 0 ? (
              <div className="space-y-4">
                {data.product_summaries.map((summary) => (
                  <div key={summary.product_id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      {summary.product_image && (
                        <img
                          src={summary.product_image}
                          alt={summary.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{summary.product_name}</h4>
                            <p className="text-sm text-gray-500">SKU: {summary.product_sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-orange-600">{summary.total_requests}</p>
                            <p className="text-xs text-gray-500">requests</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center text-yellow-600">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {summary.pending_count} pending
                          </span>
                          <span className="text-gray-500">
                            Latest: {new Date(summary.latest_request).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 font-medium mb-2">Recent requests from:</p>
                          <div className="flex flex-wrap gap-2">
                            {summary.request_details.slice(0, 3).map((detail) => (
                              <span key={detail.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {detail.user_name} ({detail.quantity} qty)
                              </span>
                            ))}
                            {summary.request_details.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{summary.request_details.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No stock requests yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && data && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">All Stock Requests</h3>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
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
                  {data.recent_requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {request.product_image && (
                            <img
                              src={request.product_image}
                              alt={request.product_name}
                              className="w-10 h-10 rounded-lg object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.product_name}</div>
                            <div className="text-sm text-gray-500">SKU: {request.product_sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.user_name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {request.user_phone}
                          </div>
                          {request.user_email && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {request.user_email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Quantity: {request.quantity}</div>
                          {(request.variant_color || request.variant_size) && (
                            <div className="text-xs text-gray-500">
                              {request.variant_color && `Color: ${request.variant_color}`}
                              {request.variant_color && request.variant_size && ' • '}
                              {request.variant_size && `Size: ${request.variant_size}`}
                            </div>
                          )}
                          {request.notes && (
                            <div className="text-xs text-gray-500 mt-1">"{request.notes}"</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(request.status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateRequestStatus(request.id, 'contacted', 'Customer contacted')}
                                className="text-blue-600 hover:text-blue-900"
                                title="Mark as contacted"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateRequestStatus(request.id, 'fulfilled', 'Product restocked')}
                                className="text-green-600 hover:text-green-900"
                                title="Mark as fulfilled"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateRequestStatus(request.id, 'cancelled', 'Request cancelled')}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel request"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.recent_requests.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No stock requests found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'contacted':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'fulfilled':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'fulfilled':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}