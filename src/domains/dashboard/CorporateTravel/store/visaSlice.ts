import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
    CreatedApplicant,
    VisaProduct,
    VisaSearchQueryParams,
    VisaState,
} from '../types/visa';

const initialState: VisaState = {
    searchParams: null,
    searchResults: [],
    selectedProduct: null,
    orderNumber: null,
    applicants: [],
    isLoading: false,
};

const visaSlice = createSlice({
    name: 'visa',
    initialState,
    reducers: {
        setVisaSearchParams(state, action: PayloadAction<VisaSearchQueryParams>) {
            state.searchParams = action.payload;
        },
        setVisaSearchResults(state, action: PayloadAction<VisaProduct[]>) {
            state.searchResults = action.payload;
        },
        setSelectedVisaProduct(state, action: PayloadAction<VisaProduct | null>) {
            state.selectedProduct = action.payload;
        },
        setVisaOrderNumber(state, action: PayloadAction<string>) {
            state.orderNumber = action.payload;
        },
        setVisaApplicants(state, action: PayloadAction<CreatedApplicant[]>) {
            state.applicants = action.payload;
        },
        setVisaLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        resetVisaState() {
            return initialState;
        },
    },
});

export const {
    setVisaSearchParams,
    setVisaSearchResults,
    setSelectedVisaProduct,
    setVisaOrderNumber,
    setVisaApplicants,
    setVisaLoading,
    resetVisaState,
} = visaSlice.actions;

export default visaSlice.reducer;
