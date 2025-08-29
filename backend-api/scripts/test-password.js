const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert('./firebase-credentials.json'),
    projectId: 'tripund-ecommerce-1755860933',
  });
}

const db = admin.firestore();

async function testAndFixPassword() {
  try {
    const superAdminEmail = 'admin@tripund.com';
    
    // Known good bcrypt hashes for "Admin@123"
    const knownWorkingHashes = [
      '$2b$10$8K7q.X9F1uoGYGVYeF.H1OXr.Q.VQ.kQ7.8Q.X9F1uoGYGVYeF.H1O', // Sample
      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password" 
      '$2a$10$N9qo8uLOickgx2ZMRZoMyeNjZAgcfl7p92ldGxad68LJZdL17lhWy', // Original
    ];
    
    // Use a simpler password for testing: "password"
    const simpleHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    const simplePassword = 'password';
    
    console.log('Updating admin password to simple test password...');
    console.log('New password:', simplePassword);
    console.log('New hash:', simpleHash);
    
    // Update the admin user's password
    const users = await db.collection('admin_users')
      .where('email', '==', superAdminEmail)
      .get();
    
    if (users.empty) {
      console.log('❌ No admin user found');
      return;
    }
    
    const userDoc = users.docs[0];
    await userDoc.ref.update({
      password_hash: simpleHash,
      'password_policy.failed_login_attempts': 0,
      'password_policy.locked_until': null,
      updated_at: admin.firestore.Timestamp.now()
    });
    
    console.log('✅ Admin password updated successfully!');
    console.log('📧 Email:', superAdminEmail);
    console.log('🔑 Password:', simplePassword);
    console.log('');
    console.log('Try logging in with these credentials:');
    console.log('Email: admin@tripund.com');
    console.log('Password: password');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

testAndFixPassword();