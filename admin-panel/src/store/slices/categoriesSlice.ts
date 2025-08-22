import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1';

interface SubCategory {
  name: string;
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
  created_at: string;
  updated_at: string;
}

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  selectedCategory: Category | null;
}

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  error: null,
  selectedCategory: null,
};

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data.categories;
  }
);

export const fetchCategory = createAsyncThunk(
  'categories/fetchCategory',
  async (id: string) => {
    const response = await axios.get(`${API_URL}/categories/${id}`);
    return response.data;
  }
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (category: Partial<Category>) => {
    const token = localStorage.getItem('adminToken');
    const response = await axios.post(`${API_URL}/admin/categories`, category, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
);

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
    const token = localStorage.getItem('adminToken');
    const response = await axios.put(`${API_URL}/admin/categories/${id}`, updates, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id: string) => {
    const token = localStorage.getItem('adminToken');
    await axios.delete(`${API_URL}/admin/categories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return id;
  }
);

export const initializeCategories = createAsyncThunk(
  'categories/initializeCategories',
  async () => {
    const token = localStorage.getItem('adminToken');
    const response = await axios.post(`${API_URL}/admin/categories/initialize`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    selectCategory: (state, action: PayloadAction<Category | null>) => {
      state.selectedCategory = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      })
      // Fetch single category
      .addCase(fetchCategory.fulfilled, (state, action) => {
        state.selectedCategory = action.payload;
      })
      // Create category
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      // Update category
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      // Delete category
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c.id !== action.payload);
      })
      // Initialize categories
      .addCase(initializeCategories.fulfilled, (state) => {
        // Refresh categories after initialization
        state.error = null;
      });
  },
});

export const { selectCategory, clearError } = categoriesSlice.actions;
export default categoriesSlice.reducer;