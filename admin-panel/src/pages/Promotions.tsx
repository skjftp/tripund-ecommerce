import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Percent,
  Tag,
  Gift,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';

interface Promotion {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  discount: number;
  status: 'active' | 'inactive' | 'expired';
  max_uses: number;
  used_count: number;
  max_uses_per_user: number;
  min_order_value: number;
  max_discount: number;
  start_date: string;
  end_date: string;
  new_customers_only: boolean;
  show_in_banner: boolean;
  allowed_user_ids: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface PromotionFormData {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  discount: number;
  status: 'active' | 'inactive';
  max_uses: number;
  max_uses_per_user: number;
  min_order_value: number;
  max_discount: number;
  start_date: string;
  end_date: string;
  new_customers_only: boolean;
  show_in_banner: boolean;
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    code: '',
    description: '',
    type: 'percentage',
    discount: 0,
    status: 'active',
    max_uses: 100,
    max_uses_per_user: 1,
    min_order_value: 0,
    max_discount: 0,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    new_customers_only: false,
    show_in_banner: false,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/promotions');
      setPromotions(response.data.promotions || []);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        start_date: new Date(formData.start_date),
        end_date: new Date(formData.end_date),
      };

      if (editingPromotion) {
        await api.put(`/admin/promotions/${editingPromotion.id}`, submitData);
        toast.success('Promotion updated successfully');
      } else {
        await api.post('/admin/promotions', submitData);
        toast.success('Promotion created successfully');
      }
      
      setShowForm(false);
      setEditingPromotion(null);
      resetForm();
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save promotion');
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      description: promotion.description,
      type: promotion.type,
      discount: promotion.discount,
      status: promotion.status as 'active' | 'inactive',
      max_uses: promotion.max_uses,
      max_uses_per_user: promotion.max_uses_per_user,
      min_order_value: promotion.min_order_value,
      max_discount: promotion.max_discount,
      start_date: new Date(promotion.start_date).toISOString().slice(0, 16),
      end_date: new Date(promotion.end_date).toISOString().slice(0, 16),
      new_customers_only: promotion.new_customers_only,
      show_in_banner: promotion.show_in_banner,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    
    try {
      await api.delete(`/admin/promotions/${id}`);
      toast.success('Promotion deleted successfully');
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete promotion');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      discount: 0,
      status: 'active',
      max_uses: 100,
      max_uses_per_user: 1,
      min_order_value: 0,
      max_discount: 0,
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      new_customers_only: false,
      show_in_banner: false,
    });
  };

  const initializeDefaults = async () => {
    try {
      await api.post('/admin/promotions/initialize');
      toast.success('Default promotions initialized');
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to initialize promotions');
    }
  };

  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || promo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600">Manage discount codes and promotional campaigns</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={initializeDefaults}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Initialize Defaults
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingPromotion(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Promotion</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search promotions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Promotions</p>
              <p className="text-2xl font-bold text-gray-900">{promotions.length}</p>
            </div>
            <Gift className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {promotions.filter(p => p.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Uses</p>
              <p className="text-2xl font-bold text-blue-600">
                {promotions.reduce((sum, p) => sum + p.used_count, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usage Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {promotions.length > 0 
                  ? Math.round((promotions.reduce((sum, p) => sum + p.used_count, 0) / 
                      promotions.reduce((sum, p) => sum + p.max_uses, 0)) * 100)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPromotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{promotion.code}</span>
                        </div>
                        <div className="text-sm text-gray-500">{promotion.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        {promotion.type === 'percentage' ? 
                          <Percent className="w-4 h-4 text-primary-600" /> : 
                          <span className="text-primary-600">₹</span>
                        }
                        <span className="text-sm font-medium">
                          {promotion.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">
                        {promotion.type === 'percentage' 
                          ? `${promotion.discount}%` 
                          : `₹${promotion.discount}`
                        }
                      </span>
                      {promotion.min_order_value > 0 && (
                        <div className="text-xs text-gray-500">
                          Min: ₹{promotion.min_order_value}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium">{promotion.used_count}</span>
                        <span className="text-gray-500"> / {promotion.max_uses}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary-600 h-1.5 rounded-full" 
                          style={{
                            width: `${Math.min((promotion.used_count / promotion.max_uses) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(promotion.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(promotion.status)}`}>
                          {promotion.status.charAt(0).toUpperCase() + promotion.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{format(new Date(promotion.end_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(promotion)}
                          className="p-1 text-gray-400 hover:text-primary-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promotion.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">
              {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'percentage' | 'fixed'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount *
                  </label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    step={formData.type === 'percentage' ? '0.1' : '1'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({...formData, max_uses: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uses Per User
                  </label>
                  <input
                    type="number"
                    value={formData.max_uses_per_user}
                    onChange={(e) => setFormData({...formData, max_uses_per_user: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order Value
                  </label>
                  <input
                    type="number"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({...formData, min_order_value: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Discount (for %)
                  </label>
                  <input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({...formData, max_discount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    disabled={formData.type === 'fixed'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-3 pt-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="new_customers_only"
                      checked={formData.new_customers_only}
                      onChange={(e) => setFormData({...formData, new_customers_only: e.target.checked})}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="new_customers_only" className="text-sm text-gray-700">
                      New customers only
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="show_in_banner"
                      checked={formData.show_in_banner}
                      onChange={(e) => setFormData({...formData, show_in_banner: e.target.checked})}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="show_in_banner" className="text-sm text-gray-700">
                      <span className="font-medium">Show in website banner</span>
                      <span className="text-gray-500 block text-xs">Display this promotion in the website header</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPromotion(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingPromotion ? 'Update' : 'Create'} Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}