import { useState, useEffect } from 'react';
import { Bell, Settings, Trash2, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Simple mock data without complex configuration access
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Order Received',
          message: 'Order has been placed successfully',
          type: 'order',
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2', 
          title: 'Payment Received',
          message: 'Payment has been processed',
          type: 'payment',
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        }
      ];
      
      setNotifications(mockNotifications);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setLoading(false);
    }
  }, []);

  const markAsRead = (id: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Manage your system notifications and alerts</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Notifications</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  try {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    toast.success('All marked as read');
                  } catch (error) {
                    console.error('Error marking all as read:', error);
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                <CheckCheck size={16} />
                <span>Mark All Read</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50">
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${!notification.read ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm px-2 py-1 rounded"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-700 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}