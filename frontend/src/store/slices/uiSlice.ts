// CSR26 UI Slice
// Manages global UI state: loading, error messages
// RULE: dispatch(startLoading()) → API call → dispatch(stopLoading()) [finally]
// RULE: Each page shows inline spinner, NO global overlay

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: UIState = {
  loading: false,
  error: null,
  successMessage: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Start loading - call BEFORE any API request
    startLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    // Stop loading - call in FINALLY block after API request
    stopLoading: (state) => {
      state.loading = false;
    },
    // Set error message
    setError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    // Set success message
    setSuccessMessage: (state, action: PayloadAction<string>) => {
      state.successMessage = action.payload;
    },
    // Clear success message
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    // Clear all messages
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
});

export const {
  startLoading,
  stopLoading,
  setError,
  clearError,
  setSuccessMessage,
  clearSuccessMessage,
  clearMessages,
} = uiSlice.actions;

export default uiSlice.reducer;
