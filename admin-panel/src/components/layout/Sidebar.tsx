import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCog,
  FolderTree,
  BarChart3,
  Settings,
  LogOut,
  Tag,
  CreditCard,
  Bell,
  FileText,
  Shield,
  MessageSquare,
  Receipt,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const dispatch = useDispatch();
  const { canAccessPage } = usePermissions();

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', pageId: 'dashboard' },
    { icon: Package, label: 'Products', path: '/products', pageId: 'products' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders', pageId: 'orders' },
    { icon: Receipt, label: 'Invoices', path: '/invoices', pageId: 'invoices' },
    { icon: Users, label: 'Customers', path: '/customers', pageId: 'customers' },
    { icon: UserCog, label: 'Admin Users', path: '/users', pageId: 'users' },
    { icon: MessageSquare, label: 'Messages', path: '/contact-messages', pageId: 'contact-messages' },
    { icon: MessageCircle, label: 'WhatsApp', path: '/whatsapp', pageId: 'whatsapp' },
    { icon: FolderTree, label: 'Categories', path: '/categories', pageId: 'categories' },
    { icon: FileText, label: 'Content', path: '/content', pageId: 'content' },
    { icon: Shield, label: 'Legal', path: '/legal', pageId: 'legal' },
    { icon: Tag, label: 'Promotions', path: '/promotions', pageId: 'promotions' },
    { icon: CreditCard, label: 'Payments', path: '/payments', pageId: 'payments' },
    { icon: Mail, label: 'Email Templates', path: '/email-templates', pageId: 'email-templates' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', pageId: 'analytics' },
    { icon: Bell, label: 'Notifications', path: '/notifications', pageId: 'notifications' },
    { icon: Settings, label: 'Settings', path: '/settings', pageId: 'settings' },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => canAccessPage(item.pageId));

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="w-64 bg-admin-sidebar h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">TRIPUND Admin</h1>
        <p className="text-gray-400 text-sm mt-1">Management Dashboard</p>
      </div>

      <nav className="flex-1 px-4 pb-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}