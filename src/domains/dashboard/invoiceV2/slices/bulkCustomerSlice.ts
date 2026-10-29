import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { BulkCustomerRow } from '../types/customer';

const initialState: BulkCustomerRow[] = [];

const bulkCustomerSlice = createSlice({
    name: 'InvoiceBulkCustomerData',
    initialState,
    reducers: {
        setBulkCustomerData: (state, action: PayloadAction<BulkCustomerRow[]>) => action.payload,
        updateBulkCustomerRow: (
            state,
            action: PayloadAction<{ index: number; data: BulkCustomerRow }>
        ) => {
            const { index, data } = action.payload;
            if (index >= 0 && index < state.length) {
                state[index] = { ...state[index], ...data };
            }
        },
    },
});

export const { setBulkCustomerData, updateBulkCustomerRow } = bulkCustomerSlice.actions;

export default bulkCustomerSlice.reducer;
