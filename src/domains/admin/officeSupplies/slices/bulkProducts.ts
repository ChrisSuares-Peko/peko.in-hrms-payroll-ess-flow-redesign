import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { bulkProduct } from '../types/products';

const initialStateData: bulkProduct[] = [];

const bulkProductsSlice = createSlice({
    name: 'bulkProducts',
    initialState: initialStateData,
    reducers: {
        setBulkProductsData: (state, action: PayloadAction<bulkProduct[]>) => action.payload,
        resetData: state => initialStateData,
        updateProductDetails: (
            state,
            action: PayloadAction<{ index: number; data: bulkProduct }>
        ) => {
            const { index, data } = action.payload;
            if (index >= 0 && index < state.length) {
                state[index] = { ...state[index], ...data };
            }
        },
        deleteProductByIndex(state, action: PayloadAction<number>) {
            const indexToDelete = action.payload;
            if (indexToDelete >= 0 && indexToDelete < state.length) {
                state.splice(indexToDelete, 1);
                // Update TID for the remaining elements
                // eslint-disable-next-line no-plusplus
                for (let i = indexToDelete; i < state.length; i++) {
                    state[i].TID = i;
                }
            }
        },
    },
});

export const { setBulkProductsData, resetData, updateProductDetails, deleteProductByIndex } =
    bulkProductsSlice.actions;

export default bulkProductsSlice.reducer;
