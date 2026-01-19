// CSR26 Gift Code Slice
// Manages gift codes: validation, batch upload, admin management
// DATA FLOW: Component → dispatch action → Redux slice calls API → Backend → DB → Response → Redux store → useSelector → UI

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { giftCodeApi } from '../../api/apiClient';
import type { GiftCode, ValidateGiftCodeRequest, ValidateGiftCodeResponse, BatchUploadGiftCodesRequest, GiftCodeStatus } from '../../types';

interface GiftCodeState {
  // All gift codes (admin)
  giftCodes: GiftCode[];
  // Validation result (landing page)
  validationResult: ValidateGiftCodeResponse | null;
  // Loading states
  loading: boolean;
  error: string | null;
  // Last batch upload result
  lastBatchUpload: { count: number; codes: GiftCode[] } | null;
}

const initialState: GiftCodeState = {
  giftCodes: [],
  validationResult: null,
  loading: false,
  error: null,
  lastBatchUpload: null,
};

// Async thunk: Validate gift code (landing page)
export const validateGiftCode = createAsyncThunk(
  'giftCode/validate',
  async (data: ValidateGiftCodeRequest, { rejectWithValue }) => {
    try {
      const response = await giftCodeApi.validate(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Fetch all gift codes (admin)
export const fetchAllGiftCodes = createAsyncThunk(
  'giftCode/fetchAll',
  async (params: { skuCode?: string; status?: GiftCodeStatus } | undefined, { rejectWithValue }) => {
    try {
      const response = await giftCodeApi.getAll(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Batch upload gift codes (admin)
export const batchUploadGiftCodes = createAsyncThunk(
  'giftCode/batchUpload',
  async (data: BatchUploadGiftCodesRequest, { rejectWithValue }) => {
    try {
      const response = await giftCodeApi.batchUpload(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Deactivate gift code (admin)
export const deactivateGiftCode = createAsyncThunk(
  'giftCode/deactivate',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await giftCodeApi.deactivate(code);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Activate gift code (admin)
export const activateGiftCode = createAsyncThunk(
  'giftCode/activate',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await giftCodeApi.activate(code);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const giftCodeSlice = createSlice({
  name: 'giftCode',
  initialState,
  reducers: {
    // Clear validation result
    clearValidationResult: (state) => {
      state.validationResult = null;
    },
    // Clear error
    clearGiftCodeError: (state) => {
      state.error = null;
    },
    // Clear last batch upload
    clearLastBatchUpload: (state) => {
      state.lastBatchUpload = null;
    },
  },
  extraReducers: (builder) => {
    // Validate gift code
    builder
      .addCase(validateGiftCode.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.validationResult = null;
      })
      .addCase(validateGiftCode.fulfilled, (state, action: PayloadAction<ValidateGiftCodeResponse>) => {
        state.loading = false;
        state.validationResult = action.payload;
      })
      .addCase(validateGiftCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch all gift codes
    builder
      .addCase(fetchAllGiftCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllGiftCodes.fulfilled, (state, action: PayloadAction<{ giftCodes: GiftCode[]; total: number }>) => {
        state.loading = false;
        state.giftCodes = action.payload.giftCodes;
      })
      .addCase(fetchAllGiftCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Batch upload gift codes
    builder
      .addCase(batchUploadGiftCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.lastBatchUpload = null;
      })
      .addCase(batchUploadGiftCodes.fulfilled, (state, action: PayloadAction<{ count: number; codes: GiftCode[] }>) => {
        state.loading = false;
        state.lastBatchUpload = action.payload;
        // Add new codes to the list
        state.giftCodes = [...action.payload.codes, ...state.giftCodes];
      })
      .addCase(batchUploadGiftCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Deactivate gift code
    builder
      .addCase(deactivateGiftCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateGiftCode.fulfilled, (state, action: PayloadAction<GiftCode>) => {
        state.loading = false;
        // Update the code in the list
        const index = state.giftCodes.findIndex(gc => gc.code === action.payload.code);
        if (index !== -1) {
          state.giftCodes[index] = action.payload;
        }
      })
      .addCase(deactivateGiftCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Activate gift code
    builder
      .addCase(activateGiftCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateGiftCode.fulfilled, (state, action: PayloadAction<GiftCode>) => {
        state.loading = false;
        // Update the code in the list
        const index = state.giftCodes.findIndex(gc => gc.code === action.payload.code);
        if (index !== -1) {
          state.giftCodes[index] = action.payload;
        }
      })
      .addCase(activateGiftCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearValidationResult,
  clearGiftCodeError,
  clearLastBatchUpload,
} = giftCodeSlice.actions;

export default giftCodeSlice.reducer;
