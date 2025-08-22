import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';

interface WishlistState {
  items: Product[];
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
};

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
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;