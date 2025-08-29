import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import { AdminUser } from '../../types';

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('adminUser');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: localStorage.getItem('adminToken'),
  isAuthenticated: !!localStorage.getItem('adminToken'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await authAPI.login(email, password);
    return response.data;
  }
);

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async () => {
  const response = await authAPI.getProfile();
  return response.data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('adminToken', action.payload.token);
        localStorage.setItem('adminUser', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('adminUser', JSON.stringify(action.payload));
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;