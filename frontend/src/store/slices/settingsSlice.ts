// CSR26 Settings Slice
// Manages global settings: pricePerKg, threshold, etc.
// Settings come from database, NEVER hardcoded
// DATA FLOW: Component → dispatch action → Redux slice calls API → Backend → DB → Response → Redux store → useSelector → UI

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { settingsApi } from '../../api/apiClient';
import type { SettingsMap, Setting } from '../../types';

interface SettingsState {
  settings: SettingsMap | null;
  loading: boolean;
  error: string | null;
  // Derived values for easy access
  pricePerKg: number;
  certificationThreshold: number;
  defaultMultiplier: number;
  monthlyBillingMinimum: number;
}

// Default values (will be overridden by DB values)
const DEFAULT_PRICE_PER_KG = 0.11;
const DEFAULT_THRESHOLD = 10;
const DEFAULT_MULTIPLIER = 1;
const DEFAULT_BILLING_MINIMUM = 10;

const initialState: SettingsState = {
  settings: null,
  loading: false,
  error: null,
  pricePerKg: DEFAULT_PRICE_PER_KG,
  certificationThreshold: DEFAULT_THRESHOLD,
  defaultMultiplier: DEFAULT_MULTIPLIER,
  monthlyBillingMinimum: DEFAULT_BILLING_MINIMUM,
};

// Async thunk: Fetch all settings
export const fetchSettings = createAsyncThunk(
  'settings/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getAll();
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Update a setting (admin only)
export const updateSetting = createAsyncThunk(
  'settings/update',
  async ({ key, value, description }: { key: string; value: string; description?: string }, { rejectWithValue }) => {
    try {
      const response = await settingsApi.update(key, { value, description });
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Helper to parse settings into derived values
const parseSettings = (settings: SettingsMap): Partial<SettingsState> => {
  return {
    pricePerKg: parseFloat(settings.PRICE_PER_KG) || DEFAULT_PRICE_PER_KG,
    certificationThreshold: parseFloat(settings.CERTIFICATION_THRESHOLD) || DEFAULT_THRESHOLD,
    defaultMultiplier: parseInt(settings.DEFAULT_MULTIPLIER) || DEFAULT_MULTIPLIER,
    monthlyBillingMinimum: parseFloat(settings.MONTHLY_BILLING_MINIMUM) || DEFAULT_BILLING_MINIMUM,
  };
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Clear error
    clearSettingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all settings
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action: PayloadAction<SettingsMap>) => {
        state.loading = false;
        state.settings = action.payload;
        // Parse derived values
        const parsed = parseSettings(action.payload);
        state.pricePerKg = parsed.pricePerKg!;
        state.certificationThreshold = parsed.certificationThreshold!;
        state.defaultMultiplier = parsed.defaultMultiplier!;
        state.monthlyBillingMinimum = parsed.monthlyBillingMinimum!;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update setting
    builder
      .addCase(updateSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSetting.fulfilled, (state, action: PayloadAction<Setting>) => {
        state.loading = false;
        // Update the specific setting in the map
        if (state.settings) {
          state.settings[action.payload.key] = action.payload.value;
          // Reparse derived values
          const parsed = parseSettings(state.settings);
          state.pricePerKg = parsed.pricePerKg!;
          state.certificationThreshold = parsed.certificationThreshold!;
          state.defaultMultiplier = parsed.defaultMultiplier!;
          state.monthlyBillingMinimum = parsed.monthlyBillingMinimum!;
        }
      })
      .addCase(updateSetting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSettingsError } = settingsSlice.actions;

export default settingsSlice.reducer;
