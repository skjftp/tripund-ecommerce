import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Store,
  Globe,
  CreditCard,
  Truck,
  Bell,
  Shield,
  Mail,
  Smartphone,
  Save,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      store_name: 'TRIPUND',
      store_email: 'support@tripund.com',
      store_phone: '+91 9876543210',
      store_address: '123 Craft Street, Mumbai, Maharashtra 400001',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      date_format: 'DD/MM/YYYY',
      logo_url: '/api/placeholder/200/60',
    },
    payment: {
      razorpay_enabled: true,
      razorpay_key: 'rzp_test_xxxxx',
      cod_enabled: true,
      cod_limit: 10000,
      prepaid_discount: 5,
      tax_rate: 18,
    },
    shipping: {
      free_shipping_threshold: 1500,
      standard_shipping_rate: 100,
      express_shipping_rate: 250,
      processing_time: '2-3 business days',
      delivery_zones: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
    },
    notifications: {
      order_confirmation: true,
      order_shipped: true,
      order_delivered: true,
      promotional_emails: true,
      sms_notifications: false,
      whatsapp_notifications: true,
    },
    security: {
      two_factor_auth: false,
      session_timeout: 30,
      password_expiry: 90,
      max_login_attempts: 5,
      ip_whitelist: [],
    },
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings');
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
      } else {
        toast.error('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
      } else {
        toast.error('Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Store Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="admin-label">Store Name</label>
            <input
              type="text"
              value={settings.general.store_name}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, store_name: e.target.value }
              })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Store Email</label>
            <input
              type="email"
              value={settings.general.store_email}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, store_email: e.target.value }
              })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Store Phone</label>
            <input
              type="tel"
              value={settings.general.store_phone}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, store_phone: e.target.value }
              })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Currency</label>
            <select
              value={settings.general.currency}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, currency: e.target.value }
              })}
              className="admin-input"
            >
              <option value="INR">INR - Indian Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="admin-label">Store Address</label>
            <textarea
              value={settings.general.store_address}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, store_address: e.target.value }
              })}
              className="admin-input"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="admin-label">Timezone</label>
            <select
              value={settings.general.timezone}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, timezone: e.target.value }
              })}
              className="admin-input"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>
          <div>
            <label className="admin-label">Date Format</label>
            <select
              value={settings.general.date_format}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, date_format: e.target.value }
              })}
              className="admin-input"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.payment.razorpay_enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, razorpay_enabled: e.target.checked }
                })}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Razorpay</div>
                <div className="text-sm text-gray-500">Accept online payments via Razorpay</div>
              </div>
            </div>
            {settings.payment.razorpay_enabled && (
              <input
                type="text"
                value={settings.payment.razorpay_key}
                onChange={(e) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, razorpay_key: e.target.value }
                })}
                placeholder="API Key"
                className="w-64 px-3 py-1 border border-gray-300 rounded"
              />
            )}
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.payment.cod_enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, cod_enabled: e.target.checked }
                })}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Cash on Delivery</div>
                <div className="text-sm text-gray-500">Allow customers to pay on delivery</div>
              </div>
            </div>
            {settings.payment.cod_enabled && (
              <input
                type="number"
                value={settings.payment.cod_limit}
                onChange={(e) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, cod_limit: parseInt(e.target.value) }
                })}
                placeholder="Max Order Value"
                className="w-32 px-3 py-1 border border-gray-300 rounded"
              />
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Tax & Discounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="admin-label">Tax Rate (%)</label>
            <input
              type="number"
              value={settings.payment.tax_rate}
              onChange={(e) => setSettings({
                ...settings,
                payment: { ...settings.payment, tax_rate: parseInt(e.target.value) }
              })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Prepaid Discount (%)</label>
            <input
              type="number"
              value={settings.payment.prepaid_discount}
              onChange={(e) => setSettings({
                ...settings,
                payment: { ...settings.payment, prepaid_discount: parseInt(e.target.value) }
              })}
              className="admin-input"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderShippingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Shipping Rates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="admin-label">Free Shipping Threshold (₹)</label>
            <input
              type="number"
              value={settings.shipping.free_shipping_threshold}
              onChange={(e) => setSettings({
                ...settings,
                shipping: { ...settings.shipping, free_shipping_threshold: parseInt(e.target.value) }
              })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Standard Shipping Rate (₹)</label>
            <input
              type="number"
              value={settings.shipping.standard_shipping_rate}
              onChange={(e) => setSettings({
                ...settings,
                shipping: { ...settings.shipping, standard_shipping_rate: parseInt(e.target.value) }
              })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Express Shipping Rate (₹)</label>
            <input
              type="number"
              value={settings.shipping.express_shipping_rate}
              onChange={(e) => setSettings({
                ...settings,
                shipping: { ...settings.shipping, express_shipping_rate: parseInt(e.target.value) }
              })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Processing Time</label>
            <input
              type="text"
              value={settings.shipping.processing_time}
              onChange={(e) => setSettings({
                ...settings,
                shipping: { ...settings.shipping, processing_time: e.target.value }
              })}
              className="admin-input"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Delivery Zones</h3>
        <div className="space-y-2">
          {settings.shipping.delivery_zones.map((zone, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={zone}
                onChange={(e) => {
                  const newZones = [...settings.shipping.delivery_zones];
                  newZones[index] = e.target.value;
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, delivery_zones: newZones }
                  });
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
              />
              <button
                onClick={() => {
                  const newZones = settings.shipping.delivery_zones.filter((_, i) => i !== index);
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, delivery_zones: newZones }
                  });
                }}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              setSettings({
                ...settings,
                shipping: { ...settings.shipping, delivery_zones: [...settings.shipping.delivery_zones, ''] }
              });
            }}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            + Add Zone
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.order_confirmation}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, order_confirmation: e.target.checked }
              })}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Order Confirmation</div>
              <div className="text-sm text-gray-500">Send email when order is placed</div>
            </div>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.order_shipped}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, order_shipped: e.target.checked }
              })}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Order Shipped</div>
              <div className="text-sm text-gray-500">Send email when order is shipped</div>
            </div>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.promotional_emails}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, promotional_emails: e.target.checked }
              })}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Promotional Emails</div>
              <div className="text-sm text-gray-500">Send marketing and promotional emails</div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Other Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.sms_notifications}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, sms_notifications: e.target.checked }
              })}
              className="mr-3"
            />
            <div>
              <div className="font-medium">SMS Notifications</div>
              <div className="text-sm text-gray-500">Send order updates via SMS</div>
            </div>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.whatsapp_notifications}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, whatsapp_notifications: e.target.checked }
              })}
              className="mr-3"
            />
            <div>
              <div className="font-medium">WhatsApp Notifications</div>
              <div className="text-sm text-gray-500">Send order updates via WhatsApp</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
        <AlertCircle className="text-yellow-600 mr-3 mt-0.5" size={20} />
        <div>
          <h4 className="font-medium text-yellow-800">Security Notice</h4>
          <p className="text-sm text-yellow-700 mt-1">
            Changing security settings may affect user access. Proceed with caution.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Authentication</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.security.two_factor_auth}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, two_factor_auth: e.target.checked }
              })}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-gray-500">Require 2FA for admin accounts</div>
            </div>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="admin-label">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.security.session_timeout}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, session_timeout: parseInt(e.target.value) }
                })}
                className="admin-input"
              />
            </div>
            <div>
              <label className="admin-label">Password Expiry (days)</label>
              <input
                type="number"
                value={settings.security.password_expiry}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, password_expiry: parseInt(e.target.value) }
                })}
                className="admin-input"
              />
            </div>
            <div>
              <label className="admin-label">Max Login Attempts</label>
              <input
                type="number"
                value={settings.security.max_login_attempts}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, max_login_attempts: parseInt(e.target.value) }
                })}
                className="admin-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your store configuration and preferences</p>
      </div>

      <div className="flex space-x-6">
        {/* Sidebar */}
        <div className="w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'payment' && renderPaymentSettings()}
            {activeTab === 'shipping' && renderShippingSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'security' && renderSecuritySettings()}

            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 admin-button disabled:opacity-50"
              >
                <Save size={20} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}