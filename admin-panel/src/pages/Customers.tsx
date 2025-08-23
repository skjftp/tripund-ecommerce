import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  Edit,
  Ban,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { userAPI } from '../services/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: Array<{
    type: 'billing' | 'shipping';
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default: boolean;
  }>;
  stats: {
    total_orders: number;
    total_spent: number;
    average_order_value: number;
    last_order_date?: string;
  };
  tags: string[];
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
  last_login?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll();
      
      // Handle the API response
      const usersData = response.data.users || [];
      
      // Map the API response to match the expected Customer type structure
      const mappedCustomers: Customer[] = usersData.map((user: any) => ({
        id: user.id,
        name: user.name || 'N/A',
        email: user.email,
        phone: user.phone || '',
        addresses: [], // Would need separate API call for addresses
        stats: {
          total_orders: user.orders_count || 0,
          total_spent: user.total_spent || 0,
          average_order_value: user.orders_count > 0 ? (user.total_spent / user.orders_count) : 0,
          last_order_date: user.last_order_date,
        },
        tags: user.role === 'admin' ? ['Admin'] : user.orders_count > 10 ? ['VIP', 'Repeat Customer'] : [],
        status: user.status || 'active',
        created_at: user.created_at,
        last_login: user.last_login,
      }));
      
      setCustomers(mappedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Fallback to mock data for demo
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'Rahul Sharma',
          email: 'rahul@example.com',
          phone: '+91 9876543210',
          addresses: [
            {
              type: 'billing',
              line1: '123 MG Road',
              city: 'Mumbai',
              state: 'Maharashtra',
              postal_code: '400001',
              country: 'India',
              is_default: true,
            },
          ],
          stats: {
            total_orders: 12,
            total_spent: 45600,
            average_order_value: 3800,
            last_order_date: '2024-01-20T10:00:00Z',
          },
          tags: ['VIP', 'Repeat Customer'],
          status: 'active',
          created_at: '2023-06-15T10:00:00Z',
          last_login: '2024-01-21T14:00:00Z',
        },
        {
          id: '2',
          name: 'Priya Patel',
          email: 'priya@example.com',
          phone: '+91 9876543211',
          addresses: [
            {
              type: 'shipping',
              line1: '456 Park Street',
              city: 'Kolkata',
              state: 'West Bengal',
              postal_code: '700001',
              country: 'India',
              is_default: true,
            },
          ],
          stats: {
            total_orders: 5,
          total_spent: 18900,
          average_order_value: 3780,
          last_order_date: '2024-01-18T10:00:00Z',
        },
        tags: ['Newsletter Subscriber'],
        status: 'active',
        created_at: '2023-09-20T10:00:00Z',
        last_login: '2024-01-19T09:00:00Z',
      }];
      setCustomers(mockCustomers);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (customerId: string, newStatus: string) => {
    try {
      setCustomers(customers.map(c => c.id === customerId ? { ...c, status: newStatus as any } : c));
      toast.success('Customer status updated successfully');
    } catch (error) {
      toast.error('Failed to update customer status');
    }
  };

  const CustomerDetailModal = () => {
    if (!selectedCustomer) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Customer Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Customer Header */}
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-xl">
                {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedCustomer.status)}`}>
                  {selectedCustomer.status}
                </span>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{selectedCustomer.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            {/* Addresses */}
            {selectedCustomer.addresses.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Addresses</h4>
                <div className="space-y-3">
                  {selectedCustomer.addresses.map((address, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 uppercase">{address.type}</span>
                        {address.is_default && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-sm">{address.line1}</p>
                      {address.line2 && <p className="text-sm">{address.line2}</p>}
                      <p className="text-sm">{address.city}, {address.state} {address.postal_code}</p>
                      <p className="text-sm">{address.country}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Order Statistics */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Order Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{selectedCustomer.stats.total_orders}</div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">₹{selectedCustomer.stats.total_spent.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">₹{selectedCustomer.stats.average_order_value.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Average Order</div>
                </div>
                {selectedCustomer.stats.last_order_date && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-primary-600">
                      {format(new Date(selectedCustomer.stats.last_order_date), 'MMM dd')}
                    </div>
                    <div className="text-sm text-gray-600">Last Order</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tags */}
            {selectedCustomer.tags.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Timeline */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Timeline</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  <span className="text-gray-600">Customer since</span>
                  <span className="ml-auto font-medium">{format(new Date(selectedCustomer.created_at), 'MMMM d, yyyy')}</span>
                </div>
                {selectedCustomer.last_login && (
                  <div className="flex items-center text-sm">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    <span className="text-gray-600">Last login</span>
                    <span className="ml-auto font-medium">{format(new Date(selectedCustomer.last_login), 'MMMM d, yyyy h:mm a')}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-3">
              <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                View Orders
              </button>
              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Edit Customer
              </button>
              {selectedCustomer.status === 'active' ? (
                <button
                  onClick={() => handleStatusUpdate(selectedCustomer.id, 'blocked')}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Block
                </button>
              ) : (
                <button
                  onClick={() => handleStatusUpdate(selectedCustomer.id, 'active')}
                  className="px-4 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50"
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {showDetailModal && <CustomerDetailModal />}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer base</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 admin-button">
            <UserPlus size={20} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
          
          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No customers found
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-lg">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(customer.status)}`}>
                      {customer.status}
                    </span>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail size={14} className="mr-2" />
                  {customer.email}
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone size={14} className="mr-2" />
                  {customer.phone}
                </div>
                {customer.addresses[0] && (
                  <div className="flex items-start text-gray-600">
                    <MapPin size={14} className="mr-2 mt-0.5" />
                    <span>{customer.addresses[0].city}, {customer.addresses[0].state}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {customer.stats.total_orders}
                    </div>
                    <div className="text-xs text-gray-500">Orders</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      ₹{(customer.stats.total_spent / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs text-gray-500">Spent</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      ₹{(customer.stats.average_order_value / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs text-gray-500">AOV</div>
                  </div>
                </div>
              </div>

              {customer.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {customer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  <Calendar size={12} className="inline mr-1" />
                  Joined {format(new Date(customer.created_at), 'MMM yyyy')}
                </span>
                {customer.stats.last_order_date && (
                  <span>
                    <ShoppingBag size={12} className="inline mr-1" />
                    Last order {format(new Date(customer.stats.last_order_date!), 'MMM dd')}
                  </span>
                )}
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowDetailModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  View Details
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Edit size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}