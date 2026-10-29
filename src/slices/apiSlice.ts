import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface ApiState {
    variant: 'info' | 'warning' | 'success' | 'error';
    description: string;
    showToast?: boolean;
}

const initialState: ApiState = {
    variant: 'info',
    description: '',
    showToast: false,
};

export const apiSlice = createSlice({
    name: 'api',
    initialState,
    reducers: {
        showToast: (state, action: PayloadAction<ApiState>) => {
            state = { ...state, ...action.payload };
            state.showToast = !state.showToast;
            return state;
        },
    },
});

export const { showToast } = apiSlice.actions;

export default apiSlice.reducer;
