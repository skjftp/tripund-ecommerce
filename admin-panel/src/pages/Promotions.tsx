import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Percent,
  Tag,
  Gift,
  Users,
  ShoppingCart,
  TrendingUp,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Promotion {
  id: string;
  name: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  discount_value: number;
  minimum_purchase?: number;
  maximum_discount?: number;
  usage_limit?: number;
  usage_per_customer?: number;
  used_count: number;
  applies_to: 'all' | 'specific_products' | 'specific_categories';
  product_ids?: string[];
  category_ids?: string[];
  start_date: string;
  end_date: string;
  status: 'active' | 'scheduled' | 'expired' | 'disabled';
  created_at: string;
  updated_at: string;
  stats: {
    total_sales: number;
    revenue_generated: number;
    conversion_rate: number;
  };
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const mockPromotions: Promotion[] = [
      {
        id: '1',
        name: 'New Year Sale',
        code: 'NEWYEAR2024',
        description: 'Get 20% off on all products',
        type: 'percentage',
        discount_value: 20,
        minimum_purchase: 1000,
        maximum_discount: 2000,
        usage_limit: 100,
        usage_per_customer: 1,
        used_count: 45,
        applies_to: 'all',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        status: 'active',
        created_at: '2023-12-20T10:00:00Z',
        updated_at: '2024-01-15T14:00:00Z',
        stats: {
          total_sales: 45,
          revenue_generated: 156000,
          conversion_rate: 12.5,
        },
      },
      {
        id: '2',
        name: 'First Purchase Discount',
        code: 'FIRST10',
        description: 'Get 10% off on your first purchase',
        type: 'percentage',
        discount_value: 10,
        minimum_purchase: 500,
        usage_per_customer: 1,
        used_count: 128,
        applies_to: 'all',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2024-01-20T09:00:00Z',
        stats: {
          total_sales: 128,
          revenue_generated: 245000,
          conversion_rate: 18.3,
        },
      },
      {
        id: '3',
        name: 'Free Shipping Weekend',
        code: 'FREESHIP',
        description: 'Free shipping on all orders',
        type: 'free_shipping',
        discount_value: 0,
        minimum_purchase: 999,
        usage_limit: 200,
        used_count: 89,
        applies_to: 'all',
        start_date: '2024-01-27T00:00:00Z',
        end_date: '2024-01-28T23:59:59Z',
        status: 'scheduled',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        stats: {
          total_sales: 0,
          revenue_generated: 0,
          conversion_rate: 0,
        },
      },
      {
        id: '4',
        name: 'Diwali Special',
        code: 'DIWALI30',
        description: '30% off on selected categories',
        type: 'percentage',
        discount_value: 30,
        minimum_purchase: 2000,
        maximum_discount: 3000,
        usage_limit: 500,
        used_count: 500,
        applies_to: 'specific_categories',
        category_ids: ['textiles', 'pottery'],
        start_date: '2023-11-10T00:00:00Z',
        end_date: '2023-11-14T23:59:59Z',
        status: 'expired',
        created_at: '2023-11-01T10:00:00Z',
        updated_at: '2023-11-14T23:59:59Z',
        stats: {
          total_sales: 500,
          revenue_generated: 890000,
          conversion_rate: 24.7,
        },
      },
    ];
    setPromotions(mockPromotions);
    setLoading(false);
  }, []);

  const filteredPromotions = promotions.filter((promotion) => {
    const matchesSearch = 
      promotion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promotion.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || promotion.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || promotion.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'disabled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'scheduled':
        return <Clock className="text-blue-500" size={16} />;
      case 'expired':
        return <XCircle className="text-gray-500" size={16} />;
      case 'disabled':
        return <XCircle className="text-red-500" size={16} />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent size={16} className="text-primary-600" />;
      case 'fixed':
        return <Tag size={16} className="text-green-600" />;
      case 'free_shipping':
        return <Truck size={16} className="text-blue-600" />;
      case 'buy_x_get_y':
        return <Gift size={16} className="text-purple-600" />;
      default:
        return <Tag size={16} className="text-gray-600" />;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        setPromotions(promotions.filter(p => p.id !== id));
        toast.success('Promotion deleted successfully');
      } catch (error) {
        toast.error('Failed to delete promotion');
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied to clipboard');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600">Manage discount codes and promotional campaigns</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 admin-button"
        >
          <Plus size={20} />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Promotions</p>
              <p className="text-2xl font-bold text-gray-900">
                {promotions.filter(p => p.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {promotions.reduce((sum, p) => sum + p.used_count, 0)}
              </p>
            </div>
            <Users className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue Generated</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(promotions.reduce((sum, p) => sum + p.stats.revenue_generated, 0) / 1000).toFixed(0)}k
              </p>
            </div>
            <TrendingUp className="text-purple-600" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Conversion</p>
              <p className="text-2xl font-bold text-gray-900">
                {(promotions.reduce((sum, p) => sum + p.stats.conversion_rate, 0) / promotions.length).toFixed(1)}%
              </p>
            </div>
            <ShoppingCart className="text-orange-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search promotions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
            <option value="free_shipping">Free Shipping</option>
            <option value="buy_x_get_y">Buy X Get Y</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
          
          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Promotion
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
                  Loading promotions...
                </td>
              </tr>
            ) : filteredPromotions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No promotions found
                </td>
              </tr>
            ) : (
              filteredPromotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(promotion.type)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                        <div className="text-sm text-gray-500">{promotion.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-gray-100 text-gray-900 rounded text-sm font-mono">
                        {promotion.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(promotion.code)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {promotion.type === 'percentage' && `${promotion.discount_value}% off`}
                      {promotion.type === 'fixed' && `₹${promotion.discount_value} off`}
                      {promotion.type === 'free_shipping' && 'Free shipping'}
                      {promotion.type === 'buy_x_get_y' && 'Buy X Get Y'}
                    </div>
                    {promotion.minimum_purchase && (
                      <div className="text-xs text-gray-500">Min: ₹{promotion.minimum_purchase}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {promotion.used_count}
                      {promotion.usage_limit && ` / ${promotion.usage_limit}`}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${promotion.usage_limit ? (promotion.used_count / promotion.usage_limit) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(promotion.start_date), 'MMM dd')} - {format(new Date(promotion.end_date), 'MMM dd')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(promotion.end_date), 'yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(promotion.status)}
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          promotion.status
                        )}`}
                      >
                        {promotion.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(promotion.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
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