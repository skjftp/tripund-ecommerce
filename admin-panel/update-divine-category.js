const fetch = require('node-fetch');

async function updateDivineCategory() {
  const API_URL = 'https://tripund-backend-665685012221.asia-south1.run.app';
  
  // First, login as admin to get token
  const loginResponse = await fetch(`${API_URL}/api/v1/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@tripund.com',
      password: 'admin123'
    })
  });

  const loginData = await loginResponse.json();
  const token = loginData.token;

  if (!token) {
    console.error('Failed to get admin token');
    return;
  }

  console.log('Admin login successful');

  // Update the Divine Collections category with the landscape image URL
  const updateData = {
    landscape_image: 'https://images.tripundlifestyle.com/categories/divine-collections-landscape.png'
  };

  const updateResponse = await fetch(`${API_URL}/api/v1/admin/categories/XdMdptha70B4ZettYEK8`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });

  if (updateResponse.ok) {
    const result = await updateResponse.json();
    console.log('Category updated successfully:', result);
  } else {
    const error = await updateResponse.text();
    console.error('Failed to update category:', updateResponse.status, error);
  }
}

updateDivineCategory().catch(console.error);