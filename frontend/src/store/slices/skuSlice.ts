// CSR26 SKU Slice
// Manages SKU data: fetch by code, list all (admin)
// SKU determines landing page behavior (6 cases A-F)
// DATA FLOW: Component → dispatch action → Redux slice calls API → Backend → DB → Response → Redux store → useSelector → UI

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { skuApi } from '../../api/apiClient';
import type { Sku } from '../../types';

interface SkuState {
  // Current SKU (for landing page)
  currentSku: Sku | null;
  // All SKUs (for admin)
  skus: Sku[];
  loading: boolean;
  error: string | null;
}

const initialState: SkuState = {
  currentSku: null,
  skus: [],
  loading: false,
  error: null,
};

// Async thunk: Fetch SKU by code (for landing page)
export const fetchSkuByCode = createAsyncThunk(
  'sku/fetchByCode',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await skuApi.getByCode(code);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Fetch all SKUs (admin)
export const fetchAllSkus = createAsyncThunk(
  'sku/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await skuApi.getAll();
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Create new SKU (admin)
export const createSku = createAsyncThunk(
  'sku/create',
  async (data: Partial<Sku>, { rejectWithValue }) => {
    try {
      const response = await skuApi.create(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Update SKU (admin)
export const updateSku = createAsyncThunk(
  'sku/update',
  async ({ code, data }: { code: string; data: Partial<Sku> }, { rejectWithValue }) => {
    try {
      const response = await skuApi.update(code, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Delete/deactivate SKU (admin)
export const deleteSku = createAsyncThunk(
  'sku/delete',
  async (code: string, { rejectWithValue }) => {
    try {
      await skuApi.delete(code);
      return code;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const skuSlice = createSlice({
  name: 'sku',
  initialState,
  reducers: {
    // Clear current SKU
    clearCurrentSku: (state) => {
      state.currentSku = null;
    },
    // Clear error
    clearSkuError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch SKU by code
    builder
      .addCase(fetchSkuByCode.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentSku = null;
      })
      .addCase(fetchSkuByCode.fulfilled, (state, action: PayloadAction<Sku>) => {
        state.loading = false;
        state.currentSku = action.payload;
      })
      .addCase(fetchSkuByCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentSku = null;
      });

    // Fetch all SKUs
    builder
      .addCase(fetchAllSkus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSkus.fulfilled, (state, action: PayloadAction<Sku[]>) => {
        state.loading = false;
        state.skus = action.payload;
      })
      .addCase(fetchAllSkus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create SKU
    builder
      .addCase(createSku.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSku.fulfilled, (state, action: PayloadAction<Sku>) => {
        state.loading = false;
        state.skus.unshift(action.payload); // Add to beginning
      })
      .addCase(createSku.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update SKU
    builder
      .addCase(updateSku.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSku.fulfilled, (state, action: PayloadAction<Sku>) => {
        state.loading = false;
        const index = state.skus.findIndex(s => s.code === action.payload.code);
        if (index !== -1) {
          state.skus[index] = action.payload;
        }
        // Update current SKU if it matches
        if (state.currentSku?.code === action.payload.code) {
          state.currentSku = action.payload;
        }
      })
      .addCase(updateSku.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete SKU
    builder
      .addCase(deleteSku.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSku.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        // Mark as inactive rather than remove
        const index = state.skus.findIndex(s => s.code === action.payload);
        if (index !== -1) {
          state.skus[index].active = false;
        }
      })
      .addCase(deleteSku.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentSku, clearSkuError } = skuSlice.actions;

export default skuSlice.reducer;
