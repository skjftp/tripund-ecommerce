const admin = require('firebase-admin');
const bcrypt = require('bcrypt');

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
    const superAdminPassword = 'Admin@123';
    
    // Generate fresh password hash
    const passwordHash = await bcrypt.hash(superAdminPassword, 10);
    console.log('Generated password hash:', passwordHash);
    
    // Find the admin user in admin_users collection
    const users = await db.collection('admin_users')
      .where('email', '==', superAdminEmail)
      .get();
    
    if (users.empty) {
      console.log('❌ No admin user found in admin_users collection');
      return;
    }
    
    // Update the password hash
    const userDoc = users.docs[0];
    await userDoc.ref.update({
      password_hash: passwordHash,
      'password_policy.failed_login_attempts': 0,
      'password_policy.locked_until': null,
      updated_at: admin.firestore.Timestamp.now()
    });
    
    console.log('✅ Admin password hash updated successfully!');
    console.log('📧 Email:', superAdminEmail);
    console.log('🔑 Password:', superAdminPassword);
    console.log('🆔 User ID:', userDoc.id);
    
  } catch (error) {
    console.error('❌ Error fixing admin password:', error.message);
  }
  
  process.exit(0);
}

fixAdminPassword();