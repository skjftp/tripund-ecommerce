import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Permission constants matching backend
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  // Product Management
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  
  // Order Management
  ORDERS_VIEW: 'orders.view',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_REFUND: 'orders.refund',
  
  // Category Management
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_EDIT: 'categories.edit',
  CATEGORIES_DELETE: 'categories.delete',
  
  // Analytics & Reports
  ANALYTICS_VIEW: 'analytics.view',
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  
  // Settings & Configuration
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  
  // System Administration
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_MAINTENANCE: 'system.maintenance'
} as const;

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EDITOR: 'editor',
  VIEWER: 'viewer'
} as const;

export function usePermissions() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const hasPermission = (permission: string): boolean => {
    // Super admin has all permissions
    if (user?.role === ROLES.SUPER_ADMIN) {
      return true;
    }
    
    // Check if user has the specific permission
    return user?.permissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasMinimumRole = (requiredRole: string): boolean => {
    const roleHierarchy: Record<string, number> = {
      [ROLES.SUPER_ADMIN]: 100,
      [ROLES.ADMIN]: 80,
      [ROLES.MANAGER]: 60,
      [ROLES.EDITOR]: 40,
      [ROLES.VIEWER]: 20
    };

    const userLevel = roleHierarchy[user?.role || ''] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  };

  const canAccessPage = (pageName: string): boolean => {
    const pagePermissions: Record<string, string[]> = {
      'dashboard': [PERMISSIONS.ANALYTICS_VIEW],
      'products': [PERMISSIONS.PRODUCTS_VIEW],
      'orders': [PERMISSIONS.ORDERS_VIEW],
      'customers': [PERMISSIONS.USERS_VIEW],
      'users': [PERMISSIONS.USERS_VIEW], // Admin user management
      'categories': [PERMISSIONS.CATEGORIES_VIEW],
      'promotions': [PERMISSIONS.PRODUCTS_VIEW], // Promotions typically need product access
      'payments': [PERMISSIONS.ORDERS_VIEW], // Payments need order access
      'analytics': [PERMISSIONS.ANALYTICS_VIEW],
      'reports': [PERMISSIONS.REPORTS_VIEW],
      'notifications': [], // All authenticated users can see notifications
      'settings': [PERMISSIONS.SETTINGS_VIEW],
      'content': [PERMISSIONS.SETTINGS_VIEW], // Content management needs settings access
      'legal': [PERMISSIONS.SETTINGS_VIEW],
      'contact-messages': [PERMISSIONS.USERS_VIEW], // Contact messages need user management access
      'email-templates': [PERMISSIONS.SETTINGS_VIEW],
      'invoices': [PERMISSIONS.ORDERS_VIEW]
    };

    const requiredPermissions = pagePermissions[pageName];
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permissions required
    }

    return hasAnyPermission(requiredPermissions);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasMinimumRole,
    canAccessPage,
    user,
    permissions: user?.permissions || [],
    role: user?.role
  };
}

// Permission wrapper component for conditional rendering
interface PermissionWrapperProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  minimumRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionWrapper({ 
  permission, 
  permissions, 
  role, 
  minimumRole, 
  children, 
  fallback = null 
}: PermissionWrapperProps) {
  const { hasPermission, hasAnyPermission, hasRole, hasMinimumRole } = usePermissions();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = hasAnyPermission(permissions);
  } else if (role) {
    hasAccess = hasRole(role);
  } else if (minimumRole) {
    hasAccess = hasMinimumRole(minimumRole);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}