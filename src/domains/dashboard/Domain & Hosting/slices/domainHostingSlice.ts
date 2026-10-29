import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { CartData, CustomerData, DomainSearchResults } from '../types/index';

interface DomainHostingState {
    searchResults: DomainSearchResults | null;
    customerId: string | null;
    customerData: CustomerData | null;
    cartData: CartData | null;
}

const initialState: DomainHostingState = {
    searchResults: null,
    customerId: null,
    customerData: null,
    cartData: null,
};

export const domainHostingSlice = createSlice({
    name: 'domainHosting',
    initialState,
    reducers: {
        setSearchResults: (state, action: PayloadAction<DomainSearchResults>) => {
            state.searchResults = action.payload;
        },
        clearSearchResults: state => {
            state.searchResults = null;
        },
        setCustomerId: (state, action: PayloadAction<string>) => {
            state.customerId = action.payload;
        },
        setCustomerData: (state, action: PayloadAction<CustomerData>) => {
            state.customerData = action.payload;
        },
        setCartData: (state, action: PayloadAction<CartData | null>) => {
            state.cartData = action.payload;
        },
        clearDomainHosting: () => initialState,
    },
});

export const {
    setSearchResults,
    clearSearchResults,
    setCustomerId,
    setCustomerData,
    setCartData,
    clearDomainHosting,
} = domainHostingSlice.actions;

export default domainHostingSlice.reducer;
