import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Product } from '../../types';
import api from '../../services/api';
import { AppDispatch } from '..';

interface WishlistState {
  items: Product[];
  syncing: boolean;
  lastSyncedAt: string | null;
}

const getInitialWishlist = (): Product[] => {
  try {
    const stored = localStorage.getItem('wishlist');
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Error parsing wishlist from localStorage:', error);
  }
  return [];
};

const initialState: WishlistState = {
  items: getInitialWishlist(),
  syncing: false,
  lastSyncedAt: null,
};

// Sync wishlist with backend
export const syncWishlistToBackend = createAsyncThunk(
  'wishlist/syncToBackend',
  async (items: Product[]) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('User not authenticated, skipping wishlist sync');
      return { synced: false };
    }

    // Send only product IDs to backend
    const wishlistIds = items.map(item => item.id);

    try {
      await api.put('/profile', { wishlist: wishlistIds });
      console.log('✅ Wishlist synced to backend');
      return { synced: true, syncedAt: new Date().toISOString() };
    } catch (error) {
      console.error('Failed to sync wishlist to backend:', error);
      return { synced: false };
    }
  }
);

// Load wishlist from backend
export const loadWishlistFromBackend = createAsyncThunk(
  'wishlist/loadFromBackend',
  async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return { wishlist: [] };
    }

    try {
      const response = await api.get('/profile');
      const userData = response.data;
      
      if (userData.wishlist && Array.isArray(userData.wishlist)) {
        console.log('📥 Loaded wishlist from backend:', userData.wishlist.length, 'items');
        
        // Fetch product details for wishlist items
        const productPromises = userData.wishlist.map(async (productId: string) => {
          try {
            const productResponse = await api.get(`/products/${productId}`);
            return productResponse.data;
          } catch (error) {
            console.error(`Failed to fetch product ${productId}:`, error);
            return null;
          }
        });
        
        const products = await Promise.all(productPromises);
        const validProducts = products.filter(p => p !== null);
        
        return { wishlist: validProducts };
      }
      return { wishlist: [] };
    } catch (error) {
      console.error('Failed to load wishlist from backend:', error);
      return { wishlist: [] };
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<Product>) => {
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      if (!state.items.find((item) => item.id === action.payload.id)) {
        state.items.push(action.payload);
        localStorage.setItem('wishlist', JSON.stringify(state.items));
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      state.items = state.items.filter((item) => item.id !== action.payload);
      localStorage.setItem('wishlist', JSON.stringify(state.items));
    },
    clearWishlist: (state) => {
      state.items = [];
      localStorage.removeItem('wishlist');
    },
    setWishlistFromBackend: (state, action: PayloadAction<Product[]>) => {
      // Merge backend wishlist with local wishlist
      const localItemsMap = new Map(state.items.map(item => [item.id, item]));
      
      // Add backend items that don't exist locally
      action.payload.forEach(backendItem => {
        if (!localItemsMap.has(backendItem.id)) {
          state.items.push(backendItem);
        }
      });
      
      localStorage.setItem('wishlist', JSON.stringify(state.items));
    },
  },
  extraReducers: (builder) => {
    builder
      // Sync to backend cases
      .addCase(syncWishlistToBackend.pending, (state) => {
        state.syncing = true;
      })
      .addCase(syncWishlistToBackend.fulfilled, (state, action) => {
        state.syncing = false;
        if (action.payload.synced && action.payload.syncedAt) {
          state.lastSyncedAt = action.payload.syncedAt;
        }
      })
      .addCase(syncWishlistToBackend.rejected, (state) => {
        state.syncing = false;
      })
      // Load from backend cases
      .addCase(loadWishlistFromBackend.fulfilled, (state, action) => {
        if (action.payload.wishlist && action.payload.wishlist.length > 0) {
          // Use the setWishlistFromBackend reducer to merge wishlists
          wishlistSlice.caseReducers.setWishlistFromBackend(state, {
            payload: action.payload.wishlist,
            type: 'wishlist/setWishlistFromBackend'
          });
        }
      });
  },
});

// Helper action creators that include sync
export const addToWishlistWithSync = (product: Product) => 
  async (dispatch: AppDispatch, getState: any) => {
    dispatch(addToWishlist(product));
    const { wishlist } = getState();
    dispatch(syncWishlistToBackend(wishlist.items));
  };

export const removeFromWishlistWithSync = (productId: string) => 
  async (dispatch: AppDispatch, getState: any) => {
    dispatch(removeFromWishlist(productId));
    const { wishlist } = getState();
    dispatch(syncWishlistToBackend(wishlist.items));
  };

export const clearWishlistWithSync = () => 
  async (dispatch: AppDispatch) => {
    dispatch(clearWishlist());
    dispatch(syncWishlistToBackend([]));
  };

export const { addToWishlist, removeFromWishlist, clearWishlist, setWishlistFromBackend } = wishlistSlice.actions;
export default wishlistSlice.reducer;