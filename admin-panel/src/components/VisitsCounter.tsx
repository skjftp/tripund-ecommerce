import { useState, useEffect } from 'react';
import { Eye, Users, Clock, TrendingUp } from 'lucide-react';
import { analyticsAPI } from '../services/api';

interface VisitsData {
  total_visits: number;
  unique_visitors: number;
  visits_by_period: Record<string, number>;
  unique_visitors_by_period: Record<string, number>;
  page_breakdown: { page: string; visits: number }[];
  period: string;
}

interface VisitsCounterProps {
  isExpanded?: boolean;
}

export default function VisitsCounter({ isExpanded = false }: VisitsCounterProps) {
  const [visitsData, setVisitsData] = useState<VisitsData | null>(null);
  const [period, setPeriod] = useState<'hourly' | 'daily'>('daily');
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(isExpanded);

  const fetchVisitsData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getVisitsStatistics(period);
      if (response?.data) {
        setVisitsData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch visits data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitsData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchVisitsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [period]);

  const formatPageName = (page: string) => {
    if (page === '/') return 'Home Page';
    if (page.startsWith('/products/')) return 'Product Detail';
    if (page === '/products') return 'Products';
    if (page === '/categories') return 'Categories';
    if (page.startsWith('/categories/')) return 'Category';
    return page.replace('/', '').charAt(0).toUpperCase() + page.slice(2);
  };

  const getRecentActivity = () => {
    if (!visitsData?.visits_by_period) return 'No data';
    
    const periods = Object.keys(visitsData.visits_by_period).sort().slice(-3);
    if (periods.length === 0) return 'No recent activity';
    
    const recentVisits = periods.map(p => visitsData.visits_by_period[p]).reduce((a, b) => a + b, 0);
    const timeframe = period === 'hourly' ? 'last 3 hours' : 'last 3 days';
    
    return `${recentVisits} visits in ${timeframe}`;
  };

  if (loading && !visitsData) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <Eye size={16} className="animate-pulse" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!visitsData) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Eye size={16} />
        <span className="text-sm">No data</span>
      </div>
    );
  }

  if (!showDetails) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDetails(true)}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Eye size={16} className="text-blue-600" />
            <span className="text-sm font-medium">{visitsData.total_visits}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-green-600" />
            <span className="text-sm font-medium">{visitsData.unique_visitors}</span>
          </div>
        </button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Total Visits: {visitsData.total_visits} | Unique: {visitsData.unique_visitors}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Website Analytics</h3>
        <div className="flex items-center space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'hourly' | 'daily')}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="daily">Daily</option>
            <option value="hourly">Hourly</option>
          </select>
          <button
            onClick={() => setShowDetails(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Eye size={16} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Total Visits</span>
            </div>
            <p className="text-xl font-bold text-blue-900">{visitsData.total_visits}</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Users size={16} className="text-green-600" />
              <span className="text-xs font-medium text-green-800">Unique Visitors</span>
            </div>
            <p className="text-xl font-bold text-green-900">{visitsData.unique_visitors}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Clock size={14} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Recent Activity</span>
          </div>
          <p className="text-sm text-gray-800">{getRecentActivity()}</p>
        </div>

        {/* Top Pages */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp size={14} className="text-purple-600" />
            <span className="text-xs font-medium text-gray-700">Top Pages</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {visitsData.page_breakdown
              .sort((a, b) => b.visits - a.visits)
              .slice(0, 5)
              .map((page, index) => (
                <div key={page.page} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate" title={page.page}>
                    {formatPageName(page.page)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-purple-500 h-1 rounded-full"
                        style={{
                          width: `${Math.min(100, (page.visits / visitsData.total_visits) * 100 * 5)}%`
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-800 w-8 text-right">
                      {page.visits}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 rounded-b-lg">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}