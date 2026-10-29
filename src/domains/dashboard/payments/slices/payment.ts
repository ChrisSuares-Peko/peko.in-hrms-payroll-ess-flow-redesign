import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { summaryTexts } from '@customtypes/general';

import { PaymentGeneric } from '../types/index';

// A pre-computed selectable variant (caller does the GST/surcharge math per
// option). Selecting one swaps in its total/summary/note and updates the payload
// amount + vendorCatalogId (which the server re-prices against).
export interface PaymentVariantOption {
    vendorCatalogId: string;
    label: string;
    price: number;
    totalAmount: number;
    paymentSummary: summaryTexts[];
    paymentNote?: { includes?: string[]; description?: string };
}

export interface PaymentState {
    billSummary: summaryTexts[];
    paymentSummary: summaryTexts[];
    title: string;
    totalAmount: number;
    couponDiscount?: number;
    payload: PaymentGeneric | null;
    url: string | null;
    minimumAmount?: null | number;
    maximumAmount?: null | number;
    earningCashbackAmount?: null | number;
    navigatePath?: any;
    isEsimPaymentLoading?: boolean;
    successPath?: string;
    // Optional "Please note" block (with an inner "What's included" list) shown on
    // the payment summary. Set per-service; undefined leaves the page unchanged.
    paymentNote?: { includes?: string[]; description?: string };
    creditBalance?: number | null;
    // Optional variant selector — rendered only when length > 1.
    variantOptions?: PaymentVariantOption[];
    selectedVariantId?: string;
}

const initialState: PaymentState = {
    billSummary: [],
    paymentSummary: [],
    title: '',
    totalAmount: 0,
    couponDiscount: 0,
    payload: null,
    url: null,
    minimumAmount: null,
    maximumAmount: null,
    navigatePath: 'dashboard',
    isEsimPaymentLoading: false,
    successPath: undefined,
    paymentNote: undefined,
    creditBalance: null,
    variantOptions: undefined,
    selectedVariantId: undefined,
};

export const paymentSlice = createSlice({
    name: 'payment',
    initialState,
    reducers: {
        setPaymentData: (
            state,
            action: PayloadAction<Omit<PaymentState, 'isEsimPaymentLoading'>>
        ) => {
            state = initialState;
            state = { ...state, ...action.payload };
            return state;
        },
        resetPaymentData: state => {
            state = initialState;
            return state;
        },
        selectPaymentVariant: (state, action: PayloadAction<string>) => {
            const option = state.variantOptions?.find(
                o => o.vendorCatalogId === action.payload
            );
            if (!option) return;
            state.selectedVariantId = option.vendorCatalogId;
            state.totalAmount = option.totalAmount;
            state.paymentSummary = option.paymentSummary;
            state.paymentNote = option.paymentNote;
            if (state.payload) {
                state.payload.amount = option.price;
                state.payload.vendorCatalogId = option.vendorCatalogId;
            }
        },
        setEsimPaymentLoading: (state, action: PayloadAction<boolean>) => {
            state.isEsimPaymentLoading = action.payload;
        },
    },
});

export const { setPaymentData, resetPaymentData, selectPaymentVariant, setEsimPaymentLoading } =
    paymentSlice.actions;

export default paymentSlice.reducer;
