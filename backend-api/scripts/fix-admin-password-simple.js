const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert('./firebase-credentials.json'),
    projectId: 'tripund-ecommerce-1755860933',
  });
}

const db = admin.firestore();

async function fixAdminPassword() {
  try {
    const superAdminEmail = 'admin@tripund.com';
    
    // Use known working bcrypt hash for "Admin@123"
    // This hash was generated with: bcrypt.hash('Admin@123', 10)
    const workingPasswordHash = '$2b$10$rEhPLXr7Y1oNr.uLHKN0.egKGXyW.4B7nA/k.A0gMr8ujQ.eMq4Ca';
    
    console.log('Looking for admin user with email:', superAdminEmail);
    
    // Find the admin user in admin_users collection
    const users = await db.collection('admin_users')
      .where('email', '==', superAdminEmail)
      .get();
    
    if (users.empty) {
      console.log('❌ No admin user found in admin_users collection');
      console.log('Creating new admin user...');
      
      // Create the admin user if it doesn't exist
      const superAdmin = {
        email: superAdminEmail,
        password_hash: workingPasswordHash,
        first_name: 'Super',
        last_name: 'Administrator',
        role: 'super_admin',
        permissions: [
          'users.view', 'users.create', 'users.edit', 'users.delete',
          'products.view', 'products.create', 'products.edit', 'products.delete',
          'orders.view', 'orders.edit', 'orders.delete', 'orders.refund',
          'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
          'analytics.view', 'reports.view', 'reports.export',
          'settings.view', 'settings.edit',
          'system.logs', 'system.backup', 'system.maintenance'
        ],
        status: 'active',
        department: 'System Administration',
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now(),
        created_by: 'system',
        password_policy: {
          require_change: false,
          last_changed: admin.firestore.Timestamp.now(),
          failed_login_attempts: 0
        }
      };
      
      await db.collection('admin_users').add(superAdmin);
      console.log('✅ Admin user created successfully!');
    } else {
      // Update existing user's password hash
      const userDoc = users.docs[0];
      console.log('Found existing admin user with ID:', userDoc.id);
      
      await userDoc.ref.update({
        password_hash: workingPasswordHash,
        'password_policy.failed_login_attempts': 0,
        'password_policy.locked_until': null,
        updated_at: admin.firestore.Timestamp.now()
      });
      
      console.log('✅ Admin password hash updated successfully!');
    }
    
    console.log('📧 Email:', superAdminEmail);
    console.log('🔑 Password: Admin@123');
    console.log('🔒 Hash:', workingPasswordHash);
    
  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  }
  
  process.exit(0);
}

fixAdminPassword();