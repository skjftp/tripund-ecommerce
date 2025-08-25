import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1';

interface SubCategory {
  name: string;
  slug?: string;
  product_count: number;
}

interface Category {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  children: SubCategory[];
  order: number;
}

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  source: string;
}

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  error: null,
  source: 'none'
};

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      const data = response.data;
      return {
        categories: Array.isArray(data.categories) ? data.categories : [],
        source: data.source || 'api'
      };
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return {
        categories: [],
        source: 'error'
      };
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = Array.isArray(action.payload.categories) ? action.payload.categories : [];
        state.source = action.payload.source || 'api';
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      });
  }
});

export default categoriesSlice.reducer;