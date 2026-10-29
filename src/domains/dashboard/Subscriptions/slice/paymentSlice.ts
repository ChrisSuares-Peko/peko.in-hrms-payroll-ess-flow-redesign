import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    SubscriptionDetailsResponse,
    SubscriptionFormData,
    userDetailsResponse,
} from '../types/types';

const initialState = {
    amount: '',
    planId: '',
    subscriptionDetails: {
        data: {
            id: 0,
            name: '',
            description: '',
            highlights: '',
            productImage: '',
            image: '',
        },
    },
    userDetails: {
        addressId: 0,
        addressLine1: '',
        addressLine2: '',
        userName: '',
        userEmail: '',
        userCountry: '',
    },
    corporateDetails: {
        companyName: '',
        domainName: '',
        adminEmail: '',
    },
};

const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        setAmount: (state, action: PayloadAction<string>) => {
            state.amount = action.payload;
        },
        setPlanId: (state, action: PayloadAction<string>) => {
            state.planId = action.payload;
        },
        setSubscriptionDetails: (
            state,
            action: PayloadAction<SubscriptionDetailsResponse | undefined>
        ) => {
            state.subscriptionDetails = { ...state.subscriptionDetails, ...action.payload };
        },
        setUserDetails: (state, action: PayloadAction<userDetailsResponse | undefined>) => {
            state.userDetails = { ...state.userDetails, ...action.payload };
        },
        setCorporateDetails: (state, action: PayloadAction<SubscriptionFormData | undefined>) => {
            state.corporateDetails = { ...state.corporateDetails, ...action.payload };
        },
        resetPaymentState: () => initialState,
    },
});

export const {
    setAmount,
    setPlanId,
    resetPaymentState,
    setSubscriptionDetails,
    setUserDetails,
    setCorporateDetails,
} = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
