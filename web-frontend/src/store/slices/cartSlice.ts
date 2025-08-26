import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product } from '../../types';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
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
};

const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

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
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;