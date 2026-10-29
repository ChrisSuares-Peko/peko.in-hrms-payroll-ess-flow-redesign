import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { summaryTexts } from '@customtypes/general';

interface PaymentState {
    billSummary: summaryTexts[];
    paymentSummary: summaryTexts[];
    title: string;
    totalAmount: number;
    cashbackBalance?: number | string | undefined;
    paymentFunction?: () => void;
}

const initialState: PaymentState = {
    billSummary: [{ key: '', value: '' }],
    paymentSummary: [],
    title: '',
    totalAmount: 0,
    cashbackBalance: 0,
};

export const paymentSlice = createSlice({
    name: 'payment',
    initialState,
    reducers: {
        setPaymentData: (state, action: PayloadAction<PaymentState>) => {
            state = { ...state, ...action.payload };
            return state;
        },
        resetPaymentData: state => {
            state = initialState;
            return state;
        },
    },
});

export const { setPaymentData } = paymentSlice.actions;

export default paymentSlice.reducer;
