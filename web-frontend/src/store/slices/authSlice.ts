import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { User, AuthResponse, Address } from '../../types';
import { storeToken, clearAuth } from '../../services/auth';
import { AppDispatch } from '..';
import { loadCartFromBackend } from './cartSlice';
import { loadWishlistFromBackend } from './wishlistSlice';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  }
);

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async () => {
  const response = await api.get<User>('/profile');
  return response.data;
});

export const updateAddresses = createAsyncThunk(
  'auth/updateAddresses',
  async (addresses: Address[]) => {
    const response = await api.put<{ message: string }>('/profile', { addresses });
    console.log('✅ Addresses synced to backend');
    return addresses;
  }
);

export const addAddress = createAsyncThunk(
  'auth/addAddress',
  async ({ address, userId }: { address: Address; userId: string }) => {
    // Get current user profile first
    const profileResponse = await api.get<User>('/profile');
    const currentAddresses = profileResponse.data.addresses || [];
    
    // Add new address
    const updatedAddresses = [...currentAddresses, address];
    
    // Update backend
    await api.put('/profile', { addresses: updatedAddresses });
    console.log('✅ Address added and synced to backend');
    
    return updatedAddresses;
  }
);

export const updateAddress = createAsyncThunk(
  'auth/updateAddress',
  async ({ address, userId }: { address: Address; userId: string }) => {
    // Get current user profile first
    const profileResponse = await api.get<User>('/profile');
    const currentAddresses = profileResponse.data.addresses || [];
    
    // Update the specific address
    const updatedAddresses = currentAddresses.map((addr) =>
      addr.id === address.id ? address : addr
    );
    
    // Update backend
    await api.put('/profile', { addresses: updatedAddresses });
    console.log('✅ Address updated and synced to backend');
    
    return updatedAddresses;
  }
);

export const deleteAddress = createAsyncThunk(
  'auth/deleteAddress',
  async ({ addressId, userId }: { addressId: string; userId: string }) => {
    // Get current user profile first
    const profileResponse = await api.get<User>('/profile');
    const currentAddresses = profileResponse.data.addresses || [];
    
    // Remove the address
    const updatedAddresses = currentAddresses.filter((addr) => addr.id !== addressId);
    
    // Update backend
    await api.put('/profile', { addresses: updatedAddresses });
    console.log('✅ Address deleted and synced to backend');
    
    return updatedAddresses;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      clearAuth();
    },
    clearError: (state) => {
      state.error = null;
    },
    setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        const expiresAt = action.payload.expires_at || Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
        storeToken(action.payload.token, expiresAt);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        const expiresAt = action.payload.expires_at || Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
        storeToken(action.payload.token, expiresAt);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      // Address management
      .addCase(updateAddresses.fulfilled, (state, action) => {
        if (state.user) {
          state.user.addresses = action.payload;
        }
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        if (state.user) {
          state.user.addresses = action.payload;
        }
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        if (state.user) {
          state.user.addresses = action.payload;
        }
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        if (state.user) {
          state.user.addresses = action.payload;
        }
      });
  },
});

// Helper function to login and sync cart/wishlist
export const loginAndSync = (email: string, password: string) => 
  async (dispatch: AppDispatch) => {
    try {
      // Login
      const loginResult = await dispatch(login({ email, password })).unwrap();
      
      // If login successful, load cart and wishlist from backend
      if (loginResult) {
        dispatch(loadCartFromBackend());
        dispatch(loadWishlistFromBackend());
        console.log('✅ User logged in, syncing cart and wishlist');
      }
      
      return loginResult;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

// Helper function to register and sync
export const registerAndSync = (userData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}) => 
  async (dispatch: AppDispatch) => {
    try {
      // Register
      const registerResult = await dispatch(register(userData)).unwrap();
      
      // If registration successful, initial sync (usually empty)
      if (registerResult) {
        dispatch(loadCartFromBackend());
        dispatch(loadWishlistFromBackend());
        console.log('✅ User registered, initializing cart and wishlist');
      }
      
      return registerResult;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

export const { logout, clearError, setAuth } = authSlice.actions;
export default authSlice.reducer;