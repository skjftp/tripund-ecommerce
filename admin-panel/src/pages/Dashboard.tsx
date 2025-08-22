import { useEffect } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Revenue',
      value: '₹4,52,300',
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+8.2%',
      isPositive: true,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Customers',
      value: '892',
      change: '+5.3%',
      isPositive: true,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Active Products',
      value: '456',
      change: '-2.1%',
      isPositive: false,
      icon: Package,
      color: 'bg-orange-500',
    },
  ];

  const revenueData = [
    { name: 'Jan', revenue: 65000, orders: 120 },
    { name: 'Feb', revenue: 72000, orders: 135 },
    { name: 'Mar', revenue: 68000, orders: 128 },
    { name: 'Apr', revenue: 85000, orders: 156 },
    { name: 'May', revenue: 92000, orders: 168 },
    { name: 'Jun', revenue: 88000, orders: 162 },
  ];

  const categoryData = [
    { name: 'Textiles', value: 35, color: '#d4a574' },
    { name: 'Pottery', value: 25, color: '#8b5cf6' },
    { name: 'Jewelry', value: 20, color: '#3b82f6' },
    { name: 'Woodwork', value: 15, color: '#10b981' },
    { name: 'Others', value: 5, color: '#f59e0b' },
  ];

  const recentOrders = [
    {
      id: '#1234',
      customer: 'Rahul Sharma',
      product: 'Handwoven Silk Saree',
      amount: '₹8,500',
      status: 'delivered',
      date: '2024-01-20',
    },
    {
      id: '#1235',
      customer: 'Priya Patel',
      product: 'Ceramic Dinner Set',
      amount: '₹3,200',
      status: 'processing',
      date: '2024-01-20',
    },
    {
      id: '#1236',
      customer: 'Amit Kumar',
      product: 'Wooden Sculpture',
      amount: '₹5,600',
      status: 'shipped',
      date: '2024-01-19',
    },
    {
      id: '#1237',
      customer: 'Sneha Reddy',
      product: 'Silver Jewelry Set',
      amount: '₹12,000',
      status: 'pending',
      date: '2024-01-19',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <span className="text-sm font-medium">{stat.change}</span>
                {stat.isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-gray-600 text-sm mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 admin-card">
          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#d4a574"
                fill="#d4a574"
                fillOpacity={0.2}
                name="Revenue (₹)"
              />
              <Line type="monotone" dataKey="orders" stroke="#8b5cf6" name="Orders" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="admin-card">
          <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <a href="/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{order.id}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{order.customer}</td>
                  <td className="py-3 px-4 text-gray-700">{order.product}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{order.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}