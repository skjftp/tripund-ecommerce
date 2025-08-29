const admin = require('firebase-admin');
const bcrypt = require('bcrypt');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'tripund-ecommerce-1755860933',
  });
}

const db = admin.firestore();

// Super admin permissions (all permissions)
const SUPER_ADMIN_PERMISSIONS = [
  // User Management
  'users.view', 'users.create', 'users.edit', 'users.delete',
  // Product Management
  'products.view', 'products.create', 'products.edit', 'products.delete',
  // Order Management
  'orders.view', 'orders.edit', 'orders.delete', 'orders.refund',
  // Category Management
  'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
  // Analytics & Reports
  'analytics.view', 'reports.view', 'reports.export',
  // Settings & Configuration
  'settings.view', 'settings.edit',
  // System Administration
  'system.logs', 'system.backup', 'system.maintenance'
];

async function createSuperAdmin() {
  try {
    const superAdminEmail = 'admin@tripund.com';
    const superAdminPassword = 'Admin@123'; // Change this to a secure password
    
    // Check if super admin already exists
    const existingUsers = await db.collection('admin_users')
      .where('email', '==', superAdminEmail)
      .get();
    
    if (!existingUsers.empty) {
      console.log('✅ Super admin user already exists');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(superAdminPassword, 10);
    
    // Create super admin user
    const superAdmin = {
      email: superAdminEmail,
      password_hash: passwordHash,
      first_name: 'Super',
      last_name: 'Administrator',
      role: 'super_admin',
      permissions: SUPER_ADMIN_PERMISSIONS,
      status: 'active',
      department: 'System Administration',
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now(),
      created_by: 'system',
      password_policy: {
        require_change: false, // Super admin doesn't need to change password
        last_changed: admin.firestore.Timestamp.now(),
        failed_login_attempts: 0
      }
    };

    await db.collection('admin_users').add(superAdmin);
    console.log('🎉 Super admin user created successfully!');
    console.log('📧 Email:', superAdminEmail);
    console.log('🔑 Password:', superAdminPassword);
    console.log('⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Failed to create super admin:', error);
  }
}

async function initializeRolesAndPermissions() {
  try {
    // Create permissions collection
    const permissions = [
      // User Management
      { name: 'users.view', display_name: 'View Users', description: 'View admin users list', category: 'User Management', is_system: true },
      { name: 'users.create', display_name: 'Create Users', description: 'Create new admin users', category: 'User Management', is_system: true },
      { name: 'users.edit', display_name: 'Edit Users', description: 'Edit admin user details', category: 'User Management', is_system: true },
      { name: 'users.delete', display_name: 'Delete Users', description: 'Delete admin users', category: 'User Management', is_system: true },
      
      // Product Management
      { name: 'products.view', display_name: 'View Products', description: 'View products list', category: 'Product Management', is_system: true },
      { name: 'products.create', display_name: 'Create Products', description: 'Create new products', category: 'Product Management', is_system: true },
      { name: 'products.edit', display_name: 'Edit Products', description: 'Edit product details', category: 'Product Management', is_system: true },
      { name: 'products.delete', display_name: 'Delete Products', description: 'Delete products', category: 'Product Management', is_system: true },
      
      // Order Management
      { name: 'orders.view', display_name: 'View Orders', description: 'View orders list', category: 'Order Management', is_system: true },
      { name: 'orders.edit', display_name: 'Edit Orders', description: 'Edit order status and details', category: 'Order Management', is_system: true },
      { name: 'orders.delete', display_name: 'Delete Orders', description: 'Delete orders', category: 'Order Management', is_system: true },
      { name: 'orders.refund', display_name: 'Process Refunds', description: 'Process order refunds', category: 'Order Management', is_system: true },
      
      // Category Management
      { name: 'categories.view', display_name: 'View Categories', description: 'View categories list', category: 'Category Management', is_system: true },
      { name: 'categories.create', display_name: 'Create Categories', description: 'Create new categories', category: 'Category Management', is_system: true },
      { name: 'categories.edit', display_name: 'Edit Categories', description: 'Edit category details', category: 'Category Management', is_system: true },
      { name: 'categories.delete', display_name: 'Delete Categories', description: 'Delete categories', category: 'Category Management', is_system: true },
      
      // Analytics & Reports
      { name: 'analytics.view', display_name: 'View Analytics', description: 'View analytics dashboard', category: 'Analytics', is_system: true },
      { name: 'reports.view', display_name: 'View Reports', description: 'View system reports', category: 'Reports', is_system: true },
      { name: 'reports.export', display_name: 'Export Reports', description: 'Export reports to files', category: 'Reports', is_system: true },
      
      // Settings & Configuration
      { name: 'settings.view', display_name: 'View Settings', description: 'View system settings', category: 'Settings', is_system: true },
      { name: 'settings.edit', display_name: 'Edit Settings', description: 'Edit system settings', category: 'Settings', is_system: true },
      
      // System Administration
      { name: 'system.logs', display_name: 'View System Logs', description: 'View system and audit logs', category: 'System', is_system: true },
      { name: 'system.backup', display_name: 'System Backup', description: 'Create and manage system backups', category: 'System', is_system: true },
      { name: 'system.maintenance', display_name: 'System Maintenance', description: 'System maintenance operations', category: 'System', is_system: true }
    ];

    // Add permissions to Firestore
    const batch = db.batch();
    permissions.forEach(permission => {
      const ref = db.collection('permissions').doc(permission.name);
      batch.set(ref, permission);
    });
    
    await batch.commit();
    console.log('✅ Permissions initialized');

    // Create roles collection
    const roles = [
      {
        name: 'super_admin',
        display_name: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: SUPER_ADMIN_PERMISSIONS,
        level: 100,
        is_system: true,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      },
      {
        name: 'admin',
        display_name: 'Administrator', 
        description: 'Full administrative access except system management',
        permissions: SUPER_ADMIN_PERMISSIONS.filter(p => !p.startsWith('system.')),
        level: 80,
        is_system: true,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      },
      {
        name: 'manager',
        display_name: 'Manager',
        description: 'Product and order management access',
        permissions: ['products.view', 'products.create', 'products.edit', 'orders.view', 'orders.edit', 'categories.view', 'categories.edit', 'analytics.view', 'reports.view'],
        level: 60,
        is_system: true,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      },
      {
        name: 'editor',
        display_name: 'Editor',
        description: 'Product and category editing access',
        permissions: ['products.view', 'products.create', 'products.edit', 'categories.view', 'categories.edit'],
        level: 40,
        is_system: true,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      },
      {
        name: 'viewer',
        display_name: 'Viewer',
        description: 'Read-only access to view data',
        permissions: ['products.view', 'orders.view', 'categories.view', 'analytics.view'],
        level: 20,
        is_system: true,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      }
    ];

    // Add roles to Firestore
    const roleBatch = db.batch();
    roles.forEach(role => {
      const ref = db.collection('roles').doc(role.name);
      roleBatch.set(ref, role);
    });
    
    await roleBatch.commit();
    console.log('✅ Roles initialized');

  } catch (error) {
    console.error('❌ Failed to initialize roles and permissions:', error);
  }
}

async function main() {
  console.log('🚀 Initializing TRIPUND Admin System...');
  
  await initializeRolesAndPermissions();
  await createSuperAdmin();
  
  console.log('✅ Admin system initialization complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Login to admin panel with super admin credentials');
  console.log('2. Change the default password');
  console.log('3. Create additional admin users as needed');
  
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});