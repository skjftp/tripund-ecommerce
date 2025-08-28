import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CartItem, Product } from '../../types';
import api from '../../services/api';
import { AppDispatch } from '..';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  syncing: boolean;
  lastSyncedAt: string | null;
}

const getInitialCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem('cart');
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
  }
  return [];
};

const initialState: CartState = {
  items: getInitialCart(),
  total: 0,
  itemCount: 0,
  syncing: false,
  lastSyncedAt: null,
};

const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

// Sync cart with backend
export const syncCartToBackend = createAsyncThunk(
  'cart/syncToBackend',
  async (items: CartItem[]) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('User not authenticated, skipping backend sync');
      return { synced: false };
    }

    const cartData = items.map(item => ({
      product_id: item.product_id,
      name: item.product.name,
      image: item.product.images?.[0] || '',
      quantity: item.quantity,
      price: item.price,
      variant_id: item.product.variant_info?.variant_id,
      color: item.product.variant_info?.color,
      size: item.product.variant_info?.size,
    }));

    try {
      await api.put('/profile', { cart: cartData });
      console.log('✅ Cart synced to backend');
      return { synced: true, syncedAt: new Date().toISOString() };
    } catch (error) {
      console.error('Failed to sync cart to backend:', error);
      return { synced: false };
    }
  }
);

// Load cart from backend
export const loadCartFromBackend = createAsyncThunk(
  'cart/loadFromBackend',
  async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return { cart: [] };
    }

    try {
      const response = await api.get('/profile');
      const userData = response.data;
      
      if (userData.cart && Array.isArray(userData.cart)) {
        console.log('📥 Loaded cart from backend:', userData.cart.length, 'items');
        
        // Transform backend cart items to frontend CartItem format
        // Note: We'll need to fetch full product details or store minimal info
        const cartItems: CartItem[] = userData.cart.map((item: any) => ({
          product_id: item.product_id,
          product: {
            id: item.product_id,
            name: item.name,
            images: [item.image],
            price: item.price,
            sale_price: item.price,
            variant_info: item.variant_id ? {
              variant_id: item.variant_id,
              color: item.color,
              size: item.size,
            } : undefined,
          } as Product,
          quantity: item.quantity,
          price: item.price,
          added_at: new Date().toISOString(),
        }));
        
        return { cart: cartItems };
      }
      return { cart: [] };
    } catch (error) {
      console.error('Failed to load cart from backend:', error);
      return { cart: [] };
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    ...initialState,
    ...calculateTotals(initialState.items),
  },
  reducers: {
    addToCart: (state, action: PayloadAction<{ product: Product; quantity: number }>) => {
      const { product, quantity } = action.payload;
      
      // Create a unique key for variant products
      const itemKey = product.variant_info 
        ? `${product.id}_${product.variant_info.variant_id}`
        : product.id;
      
      const existingItem = state.items.find((item) => {
        // Check if it's the same product and same variant (if applicable)
        if (item.product_id !== product.id) return false;
        
        // If product has variant info, compare variant IDs
        if (product.variant_info && item.product.variant_info) {
          return item.product.variant_info.variant_id === product.variant_info.variant_id;
        }
        
        // If neither has variant info, it's the same product
        return !item.product.variant_info;
      });

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          product_id: product.id,
          product,
          quantity,
          price: product.sale_price || product.price || 0,
          added_at: new Date().toISOString(),
        });
      }

      const totals = calculateTotals(state.items);
      state.total = totals.total;
      state.itemCount = totals.itemCount;
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action: PayloadAction<string | { productId: string; variantId?: string }>) => {
      // Handle both string (product ID) and object (product ID with variant ID)
      if (typeof action.payload === 'string') {
        // Legacy: remove by product ID only
        state.items = state.items.filter((item) => item.product_id !== action.payload);
      } else {
        // New: remove specific variant
        const { productId, variantId } = action.payload;
        state.items = state.items.filter((item) => {
          if (item.product_id !== productId) return true;
          if (variantId && item.product.variant_info) {
            return item.product.variant_info.variant_id !== variantId;
          }
          return false;
        });
      }
      const totals = calculateTotals(state.items);
      state.total = totals.total;
      state.itemCount = totals.itemCount;
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.items.find((item) => item.product_id === action.payload.productId);
      if (item) {
        item.quantity = action.payload.quantity;
        const totals = calculateTotals(state.items);
        state.total = totals.total;
        state.itemCount = totals.itemCount;
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      localStorage.removeItem('cart');
    },
    setCartFromBackend: (state, action: PayloadAction<CartItem[]>) => {
      // Merge backend cart with local cart (prefer local for conflicts)
      const localItemsMap = new Map(state.items.map(item => [
        item.product.variant_info 
          ? `${item.product_id}_${item.product.variant_info.variant_id}`
          : item.product_id,
        item
      ]));
      
      // Add backend items that don't exist locally
      action.payload.forEach(backendItem => {
        const key = backendItem.product.variant_info
          ? `${backendItem.product_id}_${backendItem.product.variant_info.variant_id}`
          : backendItem.product_id;
        
        if (!localItemsMap.has(key)) {
          state.items.push(backendItem);
        }
      });
      
      const totals = calculateTotals(state.items);
      state.total = totals.total;
      state.itemCount = totals.itemCount;
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
  },
  extraReducers: (builder) => {
    builder
      // Sync to backend cases
      .addCase(syncCartToBackend.pending, (state) => {
        state.syncing = true;
      })
      .addCase(syncCartToBackend.fulfilled, (state, action) => {
        state.syncing = false;
        if (action.payload.synced && action.payload.syncedAt) {
          state.lastSyncedAt = action.payload.syncedAt;
        }
      })
      .addCase(syncCartToBackend.rejected, (state) => {
        state.syncing = false;
      })
      // Load from backend cases
      .addCase(loadCartFromBackend.fulfilled, (state, action) => {
        if (action.payload.cart && action.payload.cart.length > 0) {
          // Use the setCartFromBackend reducer to merge carts
          cartSlice.caseReducers.setCartFromBackend(state, {
            payload: action.payload.cart,
            type: 'cart/setCartFromBackend'
          });
        }
      });
  },
});

// Helper action creators that include sync
export const addToCartWithSync = (product: Product, quantity: number = 1) => 
  async (dispatch: AppDispatch, getState: any) => {
    dispatch(addToCart({ product, quantity }));
    const { cart } = getState();
    dispatch(syncCartToBackend(cart.items));
  };

export const removeFromCartWithSync = (payload: string | { productId: string; variantId?: string }) => 
  async (dispatch: AppDispatch, getState: any) => {
    dispatch(removeFromCart(payload));
    const { cart } = getState();
    dispatch(syncCartToBackend(cart.items));
  };

export const updateQuantityWithSync = (productId: string, quantity: number) => 
  async (dispatch: AppDispatch, getState: any) => {
    dispatch(updateQuantity({ productId, quantity }));
    const { cart } = getState();
    dispatch(syncCartToBackend(cart.items));
  };

export const clearCartWithSync = () => 
  async (dispatch: AppDispatch) => {
    dispatch(clearCart());
    dispatch(syncCartToBackend([]));
  };

export const { addToCart, removeFromCart, updateQuantity, clearCart, setCartFromBackend } = cartSlice.actions;
export default cartSlice.reducer;