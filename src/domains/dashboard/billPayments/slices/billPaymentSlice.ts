import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface BillPaymentsState {
    bills: any;
}

const initialState: BillPaymentsState = {
    bills: {},
};

export const billpaymentSlice = createSlice({
    name: 'billpaymentSlice',
    initialState,
    reducers: {
        setPostpaid: (state, action: PayloadAction<Partial<any>>) => {
            state.bills = { ...state.bills, ...action.payload };
        },
        clearPostpaid: () => initialState,
    },
});

export const { setPostpaid, clearPostpaid } = billpaymentSlice.actions;

export default billpaymentSlice.reducer;
