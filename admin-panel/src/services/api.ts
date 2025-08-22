import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tripund-backend-rafqv5m7ga-el.a.run.app/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/admin/auth/login', { email, password }),
  logout: () => api.post('/admin/auth/logout'),
  getProfile: () => api.get('/admin/auth/profile'),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
  getRevenue: (period: string) => api.get(`/admin/dashboard/revenue?period=${period}`),
};

// Product APIs
export const productAPI = {
  getAll: (params?: any) => api.get('/admin/products', { params }),
  getById: (id: string) => api.get(`/admin/products/${id}`),
  create: (data: any) => api.post('/admin/products', data),
  update: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
  updateInventory: (id: string, quantity: number) =>
    api.patch(`/admin/products/${id}/inventory`, { quantity }),
};

// Order APIs
export const orderAPI = {
  getAll: (params?: any) => api.get('/admin/orders', { params }),
  getById: (id: string) => api.get(`/admin/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),
  updateTracking: (id: string, tracking: any) =>
    api.patch(`/admin/orders/${id}/tracking`, tracking),
  refund: (id: string, amount: number) =>
    api.post(`/admin/orders/${id}/refund`, { amount }),
};

// User APIs
export const userAPI = {
  getAll: (params?: any) => api.get('/admin/users', { params }),
  getById: (id: string) => api.get(`/admin/users/${id}`),
  update: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/users/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get('/admin/categories'),
  getById: (id: string) => api.get(`/admin/categories/${id}`),
  create: (data: any) => api.post('/admin/categories', data),
  update: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  delete: (id: string) => api.delete(`/admin/categories/${id}`),
};

export default api;