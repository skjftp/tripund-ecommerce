# TRIPUND Admin System Setup Guide

## Quick Setup Instructions

Since the complete RBAC system has been implemented and deployed, follow these steps to initialize your admin system:

## 1. Create Super Admin User

### Method 1: Using Firestore Console (Recommended)
1. Go to [Firestore Console](https://console.cloud.google.com/firestore/databases/-default-/data/panel?project=tripund-ecommerce-1755860933)
2. Create collection: **`admin_users`**
3. Add document with the following data:

```json
{
  "email": "admin@tripund.com",
  "password_hash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeNjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "first_name": "Super",
  "last_name": "Administrator", 
  "role": "super_admin",
  "permissions": [
    "users.view", "users.create", "users.edit", "users.delete",
    "products.view", "products.create", "products.edit", "products.delete",
    "orders.view", "orders.edit", "orders.delete", "orders.refund",
    "categories.view", "categories.create", "categories.edit", "categories.delete",
    "analytics.view", "reports.view", "reports.export",
    "settings.view", "settings.edit",
    "system.logs", "system.backup", "system.maintenance"
  ],
  "status": "active",
  "department": "System Administration",
  "created_at": "2025-08-29T17:15:00Z",
  "updated_at": "2025-08-29T17:15:00Z", 
  "created_by": "system",
  "password_policy": {
    "require_change": false,
    "last_changed": "2025-08-29T17:15:00Z",
    "failed_login_attempts": 0
  }
}
```

### Method 2: Using Backend Script (when permissions are fixed)
```bash
cd backend-api
node scripts/init-super-admin.js
```

## 2. Login to Admin Panel

1. **URL**: https://tripundlifestyle-admin.netlify.app/users
2. **Credentials**: 
   - **Email**: `admin@tripund.com`
   - **Password**: `Admin@123`
3. **First Steps**:
   - Change password immediately using "Change Password" button
   - Create additional admin users for your team

## 3. Available Roles & Permissions

### Roles Hierarchy:
1. **Super Admin** (Level 100)
   - **All 23 permissions**
   - Cannot be deleted
   - Full system access

2. **Admin** (Level 80)  
   - **20 permissions** (all except system management)
   - User management, products, orders, settings

3. **Manager** (Level 60)
   - **9 permissions**
   - Product management, order editing, analytics

4. **Editor** (Level 40)
   - **5 permissions** 
   - Product and category editing only

5. **Viewer** (Level 20)
   - **4 permissions**
   - Read-only access to core data

### Permission Categories:
- **User Management** (4 permissions)
- **Product Management** (4 permissions)  
- **Order Management** (4 permissions)
- **Category Management** (4 permissions)
- **Analytics** (3 permissions)
- **Settings** (2 permissions)
- **System** (3 permissions)

## 4. User Management Features

### Admin Panel UI Features:
- **User List**: View all admin users with roles and status
- **Create User**: Add new admin users with role assignment
- **Edit User**: Update user details, role, and permissions
- **Delete User**: Remove users (except super admin)
- **Change Password**: Secure password update with validation
- **Search & Filter**: Find users by name, email, role, status

### Security Features:
- **Strong Passwords**: 8+ chars, mixed case, numbers, special characters
- **Account Locking**: 5 failed attempts = 30-minute lockout
- **Session Tracking**: Login monitoring with IP and device info
- **Audit Logging**: All admin actions are tracked
- **JWT Tokens**: Include roles and permissions for API access

## 5. API Endpoints

### Authentication:
```
POST /admin/auth/login - Admin login with enhanced JWT
```

### User Management:
```
GET    /admin/users     - List all admin users
GET    /admin/users/:id - Get specific user  
POST   /admin/users     - Create new admin user
PUT    /admin/users/:id - Update admin user
DELETE /admin/users/:id - Delete admin user (soft delete)
```

### Password Management:
```
POST /admin/change-password - Change current user's password
```

### Role & Permission Info:
```
GET /admin/roles       - List all available roles
GET /admin/permissions - List all available permissions  
```

## 6. Security Best Practices

### Password Requirements:
- Minimum 8 characters
- Must include uppercase letter (A-Z)
- Must include lowercase letter (a-z)  
- Must include number (0-9)
- Must include special character (!@#$%^&*)

### Account Security:
- Failed login attempts are tracked
- Account locks after 5 failed attempts for 30 minutes
- Password change history is maintained
- All admin actions are audit logged

### Session Management:
- JWT tokens expire after 24 hours
- Tokens include user role and permissions
- Session tracking includes IP address and user agent
- Logout invalidates the current session

## 7. Troubleshooting

### Common Issues:

**"Insufficient permissions" errors**
- Check user role and permissions in admin_users collection
- Verify JWT token includes correct role and permissions claims
- Super admin should have all permissions automatically

**Login failures**
- Check account status is "active"
- Verify password hasn't expired (password_policy.expires_at)
- Check if account is locked (password_policy.locked_until)

**API access denied**  
- Ensure proper Authorization header with Bearer token
- Verify route has correct RBAC middleware protection
- Check user has required permissions for the action

### Debug Steps:
1. Check Cloud Run logs for authentication errors
2. Verify Firestore has admin_users collection with data
3. Test API endpoints with curl and valid JWT tokens
4. Use browser dev tools to inspect network requests

---

**Important Notes:**
- The `firebase-credentials.json` file is now in .gitignore for security
- Always change default passwords immediately after first login  
- Regular security audits should be performed using audit logs
- Consider implementing password rotation policies for enhanced security

Last Updated: August 29, 2025
System Status: Ready for Production