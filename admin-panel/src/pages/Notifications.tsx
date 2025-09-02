import { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Settings,
  Package,
  ShoppingCart,
  Users,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  MessageSquare,
  MoreVertical,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'user' | 'system' | 'alert' | 'info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: {
    order_id?: string;
    user_id?: string;
    amount?: number;
  };
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Notifications component error:', event.error);
      setError('Failed to load notifications');
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'New Order Received',
        message: 'Order #ORD-2024-005 has been placed by Rahul Sharma for ₹12,500',
        type: 'order',
        priority: 'high',
        read: false,
        action_url: '/orders/ORD-2024-005',
        action_label: 'View Order',
        metadata: {
          order_id: 'ORD-2024-005',
          amount: 12500,
        },
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      },
      {
        id: '2',
        title: 'Payment Failed',
        message: 'Payment for Order #ORD-2024-004 has failed. Customer has been notified.',
        type: 'payment',
        priority: 'urgent',
        read: false,
        action_url: '/payments',
        action_label: 'View Payment',
        metadata: {
          order_id: 'ORD-2024-004',
          amount: 8900,
        },
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      },
      {
        id: '3',
        title: 'Low Stock Alert',
        message: 'Product "Handwoven Silk Saree" is running low on stock. Only 3 units remaining.',
        type: 'alert',
        priority: 'medium',
        read: false,
        action_url: '/products',
        action_label: 'Manage Stock',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: '4',
        title: 'New Customer Registration',
        message: 'A new customer "Priya Mehta" has registered on the platform.',
        type: 'user',
        priority: 'low',
        read: true,
        action_url: '/customers',
        action_label: 'View Customer',
        metadata: {
          user_id: 'USR-2024-089',
        },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      },
      {
        id: '5',
        title: 'System Update Available',
        message: 'A new system update is available. Please update to version 2.1.0 for improved performance.',
        type: 'system',
        priority: 'low',
        read: true,
        action_url: '/settings',
        action_label: 'Update Now',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
      {
        id: '6',
        title: 'Order Cancelled',
        message: 'Order #ORD-2024-003 has been cancelled by the customer.',
        type: 'order',
        priority: 'medium',
        read: true,
        action_url: '/orders/ORD-2024-003',
        action_label: 'View Details',
        metadata: {
          order_id: 'ORD-2024-003',
        },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      },
    ];
    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
    const matchesUnread = !showOnlyUnread || !notification.read;
    return matchesType && matchesPriority && matchesUnread;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="text-blue-500" size={20} />;
      case 'payment':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'user':
        return <Users className="text-purple-500" size={20} />;
      case 'system':
        return <Settings className="text-gray-500" size={20} />;
      case 'alert':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'info':
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    toast.success('Marked as read');
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      setNotifications([]);
      toast.success('All notifications deleted');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Notifications</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with important events and alerts
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <CheckCheck size={20} />
            <span>Mark All Read</span>
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Trash2 size={20} />
            <span>Clear All</span>
          </button>
          <button className="flex items-center space-x-2 admin-button">
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="order">Orders</option>
            <option value="payment">Payments</option>
            <option value="user">Users</option>
            <option value="system">System</option>
            <option value="alert">Alerts</option>
            <option value="info">Info</option>
          </select>
          
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showOnlyUnread}
              onChange={(e) => setShowOnlyUnread(e.target.checked)}
              className="rounded text-primary-600"
            />
            <span className="ml-2 text-sm text-gray-600">Show only unread</span>
          </label>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 ml-auto">
            <Filter size={20} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all ${
                !notification.read ? 'border-l-4 border-l-primary-500 bg-primary-50/20' : ''
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                      <div className="mt-3 flex items-center space-x-4">
                        <span className="text-xs text-gray-500">
                          <Clock size={12} className="inline mr-1" />
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {notification.action_label} →
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Mark as read"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Settings Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="text-blue-600 mt-0.5" size={20} />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Notification Settings</h4>
            <p className="mt-1 text-sm text-blue-700">
              Configure your notification preferences in Settings → Notifications to control which alerts you receive
              and how you receive them (email, SMS, or in-app).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}