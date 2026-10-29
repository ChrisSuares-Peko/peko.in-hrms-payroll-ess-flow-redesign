import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { Challan, ChallanSummary } from '../types/index';

interface ChallanState {
    challans: Challan[];
    summary: ChallanSummary;
    // Challans carried into the Review/Payment Summary step.
    cart: Challan[];
}

const initialState: ChallanState = {
    challans: [],
    summary: { totalOutstanding: 0, pending: 0, paid: 0, courtMatters: 0 },
    cart: [],
};

export const challanSlice = createSlice({
    name: 'challanSlice',
    initialState,
    reducers: {
        setChallanData: (
            state,
            action: PayloadAction<{ challans: Challan[]; summary: ChallanSummary }>
        ) => {
            state.challans = action.payload.challans;
            state.summary = action.payload.summary;
        },
        setChallanCart: (state, action: PayloadAction<Challan[]>) => {
            state.cart = action.payload;
        },
        clearChallanCart: state => {
            state.cart = [];
        },
        clearChallan: () => initialState,
    },
});

export const { setChallanData, setChallanCart, clearChallanCart, clearChallan } =
    challanSlice.actions;

export default challanSlice.reducer;
