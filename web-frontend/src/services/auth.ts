import api from './api';

const TOKEN_KEY = 'token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const REFRESH_THRESHOLD = 24 * 60 * 60 * 1000; // Refresh if token expires in less than 1 day

export interface AuthToken {
  token: string;
  expires_at: number;
}

// Store token with expiry
export const storeToken = (token: string, expiresAt: number) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
};

// Get token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Check if token needs refresh
export const shouldRefreshToken = (): boolean => {
  const token = getToken();
  if (!token) return false;

  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return false;

  const expiry = parseInt(expiryStr) * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeUntilExpiry = expiry - now;

  // Refresh if less than 1 day until expiry
  return timeUntilExpiry < REFRESH_THRESHOLD && timeUntilExpiry > 0;
};

// Refresh token
export const refreshToken = async (): Promise<boolean> => {
  try {
    const response = await api.post('/auth/refresh');
    const { token, expires_at } = response.data;
    
    storeToken(token, expires_at);
    return true;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
};

// Auto-refresh token if needed
export const autoRefreshToken = async () => {
  if (shouldRefreshToken()) {
    await refreshToken();
  }
};

// Clear auth data
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// Initialize auto-refresh on app start
export const initializeAuthRefresh = () => {
  // Check and refresh on initialization
  autoRefreshToken();

  // Set up periodic check (every hour)
  setInterval(() => {
    autoRefreshToken();
  }, 60 * 60 * 1000);
};