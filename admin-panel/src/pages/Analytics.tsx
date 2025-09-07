import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Eye,
  MapPin,
  Smartphone,
  Monitor,
  ArrowUp,
  ArrowDown,
  Instagram,
  Target,
  MousePointer,
  Globe,
  BarChart3,
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
import { format } from 'date-fns';

interface AnalyticsSummary {
  total_visits: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  traffic_sources: Record<string, number>;
  conversion_rate: number;
  total_orders: number;
  revenue: number;
  device_breakdown: Record<string, number>;
  country_breakdown: Record<string, number>;
  date_range: string;
}

interface InstagramPerformance {
  campaign_name: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversion_rate: number;
  revenue_per_click: number;
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Mock data for charts
  const revenueData = [
    { date: 'Jan 1', revenue: 12000, orders: 23, visitors: 450 },
    { date: 'Jan 5', revenue: 15000, orders: 28, visitors: 520 },
    { date: 'Jan 10', revenue: 18000, orders: 35, visitors: 680 },
    { date: 'Jan 15', revenue: 22000, orders: 42, visitors: 750 },
    { date: 'Jan 20', revenue: 19000, orders: 38, visitors: 620 },
    { date: 'Jan 25', revenue: 25000, orders: 48, visitors: 890 },
    { date: 'Jan 30', revenue: 28000, orders: 52, visitors: 920 },
  ];

  const categoryPerformance = [
    { name: 'Textiles', sales: 45000, products: 156, growth: 12.5 },
    { name: 'Pottery', sales: 32000, products: 89, growth: 8.3 },
    { name: 'Jewelry', sales: 38000, products: 120, growth: 15.7 },
    { name: 'Woodwork', sales: 28000, products: 67, growth: -3.2 },
    { name: 'Metalwork', sales: 18000, products: 45, growth: 6.8 },
  ];

  const trafficSources = [
    { name: 'Direct', value: 35, color: '#d4a574' },
    { name: 'Organic Search', value: 28, color: '#8b5cf6' },
    { name: 'Social Media', value: 20, color: '#3b82f6' },
    { name: 'Referral', value: 12, color: '#10b981' },
    { name: 'Email', value: 5, color: '#f59e0b' },
  ];

  const deviceTypes = [
    { name: 'Mobile', value: 58, color: '#8b5cf6' },
    { name: 'Desktop', value: 32, color: '#3b82f6' },
    { name: 'Tablet', value: 10, color: '#10b981' },
  ];

  const topProducts = [
    { name: 'Handwoven Silk Saree', sales: 45, revenue: 382500, trend: 'up' },
    { name: 'Ceramic Dinner Set', sales: 38, revenue: 121600, trend: 'up' },
    { name: 'Silver Jewelry Set', sales: 32, revenue: 384000, trend: 'down' },
    { name: 'Wooden Sculpture', sales: 28, revenue: 156800, trend: 'up' },
    { name: 'Brass Artifacts', sales: 25, revenue: 87500, trend: 'stable' },
  ];

  const topLocations = [
    { city: 'Mumbai', orders: 234, revenue: 456000 },
    { city: 'Delhi', orders: 189, revenue: 367000 },
    { city: 'Bangalore', orders: 156, revenue: 298000 },
    { city: 'Chennai', orders: 123, revenue: 234000 },
    { city: 'Kolkata', orders: 98, revenue: 187000 },
  ];

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: '₹12.5L',
      change: '+23.5%',
      isPositive: true,
      icon: DollarSign,
      description: 'vs last month',
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+18.2%',
      isPositive: true,
      icon: ShoppingCart,
      description: 'vs last month',
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '+0.8%',
      isPositive: true,
      icon: TrendingUp,
      description: 'vs last month',
    },
    {
      title: 'Avg Order Value',
      value: '₹10,132',
      change: '-5.3%',
      isPositive: false,
      icon: Package,
      description: 'vs last month',
    },
    {
      title: 'New Customers',
      value: '342',
      change: '+12.7%',
      isPositive: true,
      icon: Users,
      description: 'vs last month',
    },
    {
      title: 'Return Rate',
      value: '2.8%',
      change: '-0.3%',
      isPositive: true,
      icon: Package,
      description: 'vs last month',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track performance and gain insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            <span>Filters</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={20} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {kpiCards.map((kpi) => (
          <div key={kpi.title} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className="text-gray-400" size={20} />
              <div className={`flex items-center text-sm ${kpi.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                <span className="ml-1">{kpi.change}</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-sm text-gray-600">{kpi.title}</div>
            <div className="text-xs text-gray-500 mt-1">{kpi.description}</div>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Revenue & Orders Trend</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedMetric('revenue')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedMetric === 'revenue'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setSelectedMetric('orders')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedMetric === 'orders'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setSelectedMetric('visitors')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedMetric === 'visitors'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Visitors
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke="#d4a574"
                fill="#d4a574"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={trafficSources}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {trafficSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {trafficSources.map((source) => (
              <div key={source.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: source.color }}
                  />
                  <span>{source.name}</span>
                </div>
                <span className="font-medium">{source.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Category Performance */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#d4a574" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device Types */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Device Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={deviceTypes}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {deviceTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            {deviceTypes.map((device) => (
              <div key={device.name}>
                <div className="flex justify-center mb-2">
                  {device.name === 'Mobile' && <Smartphone size={20} className="text-gray-600" />}
                  {device.name === 'Desktop' && <Monitor size={20} className="text-gray-600" />}
                  {device.name === 'Tablet' && <Package size={20} className="text-gray-600" />}
                </div>
                <div className="text-lg font-semibold">{device.value}%</div>
                <div className="text-xs text-gray-500">{device.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Top Locations</h3>
          <div className="space-y-3">
            {topLocations.map((location, index) => (
              <div key={location.city} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{location.city}</div>
                    <div className="text-xs text-gray-500">{location.orders} orders</div>
                  </div>
                </div>
                <div className="text-sm font-medium">₹{(location.revenue / 1000).toFixed(0)}k</div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full text-center text-sm text-primary-600 hover:text-primary-700">
            View All Locations →
          </button>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Top Performing Products</h3>
          <button className="text-primary-600 hover:text-primary-700 text-sm">
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sales</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Trend</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">{product.sales} units</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{product.revenue.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {product.trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
                      {product.trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
                      {product.trend === 'stable' && <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-700">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}