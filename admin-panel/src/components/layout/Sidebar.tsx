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
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const dispatch = useDispatch();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: Receipt, label: 'Invoices', path: '/invoices' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: UserCog, label: 'Admin Users', path: '/users' },
    { icon: MessageSquare, label: 'Messages', path: '/contact-messages' },
    { icon: FolderTree, label: 'Categories', path: '/categories' },
    { icon: FileText, label: 'Content', path: '/content' },
    { icon: Shield, label: 'Legal', path: '/legal' },
    { icon: Tag, label: 'Promotions', path: '/promotions' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: Mail, label: 'Email Templates', path: '/email-templates' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

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