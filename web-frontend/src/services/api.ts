import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tripund-backend-rafqv5m7ga-el.a.run.app/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track if we're already showing login modal
let isShowingAuthModal = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect immediately - check the context
      const currentPath = window.location.pathname;
      
      // Only auto-redirect to login for protected pages
      const protectedPaths = ['/profile', '/orders'];
      const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));
      
      if (isProtectedPath) {
        localStorage.removeItem('token');
        window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
      } else {
        // For checkout and other pages, don't force logout
        // The page can handle the 401 error itself
        console.warn('Authentication required, but not forcing logout');
      }
    }
    return Promise.reject(error);
  }
);

export default api;