import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface LoaderState {
    isLoading: boolean;
}

const initialState: LoaderState = {
    isLoading: false,
};

export const loaderSlice = createSlice({
    name: 'loader',
    initialState,
    reducers: {
        showLoader: state => {
            state.isLoading = true;
        },
        hideLoader: state => {
            state.isLoading = false;
        },
        setLoading: (state, action: PayloadAction<LoaderState>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { showLoader, hideLoader, setLoading } = loaderSlice.actions;

export default loaderSlice.reducer;
