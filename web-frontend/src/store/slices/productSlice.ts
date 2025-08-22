import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Product } from '../../types';
import { sampleProducts } from '../../data/sampleProducts';

interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;
  filters: {
    category: string;
    minPrice: number;
    maxPrice: number;
    sortBy: string;
  };
}

const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  currentProduct: null,
  loading: false,
  error: null,
  filters: {
    category: '',
    minPrice: 0,
    maxPrice: 100000,
    sortBy: 'newest',
  },
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params?: { category?: string; featured?: boolean; limit?: number }) => {
    try {
      const response = await api.get('/products', { params });
      const products = response.data.products;
      return Array.isArray(products) ? products : [];
    } catch (error) {
      // Return sample data if API fails
      let filteredProducts = [...sampleProducts];
      if (params?.category) {
        filteredProducts = filteredProducts.filter(p => p.category === params.category);
      }
      if (params?.featured) {
        filteredProducts = filteredProducts.filter(p => p.featured);
      }
      if (params?.limit) {
        filteredProducts = filteredProducts.slice(0, params.limit);
      }
      return filteredProducts;
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: string) => {
    try {
      const response = await api.get<Product>(`/products/${id}`);
      return response.data;
    } catch (error) {
      // Return sample data if API fails
      const product = sampleProducts.find(p => p.id === id);
      if (product) return product;
      throw new Error('Product not found');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (query: string) => {
    try {
      const response = await api.get('/products/search', { params: { q: query } });
      const products = response.data.products;
      return Array.isArray(products) ? products : [];
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ProductState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.products = Array.isArray(action.payload) ? action.payload : [];
        if ((action as any).meta?.arg?.featured) {
          state.featuredProducts = Array.isArray(action.payload) ? action.payload : [];
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action: PayloadAction<Product>) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch product';
      })
      .addCase(searchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.products = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

export const { setFilters, clearFilters } = productSlice.actions;
export default productSlice.reducer;