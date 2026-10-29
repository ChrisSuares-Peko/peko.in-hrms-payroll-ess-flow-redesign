import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { GstSetup, KycBusiness, TaxMoreState } from '../types';

const initialState: TaxMoreState = {
    panNumber: '',
    fullName: '',
    dob: '',
    panVerified: false,
    selectedBusinessId: null,
    selectedFinancialYear: null,
    kycComplete: false,
    activeSetup: null,
    kycBusinesses: [],
    gstPortalUsername: '',
};

const taxMoreSlice = createSlice({
    name: 'taxMore',
    initialState,
    reducers: {
        setPanDetails: (
            state,
            action: PayloadAction<{ pan: string; fullName: string; dob: string }>
        ) => {
            state.panNumber = action.payload.pan;
            state.fullName = action.payload.fullName;
            state.dob = action.payload.dob;
            state.panVerified = true;
        },
        setSelectedBusiness: (state, action: PayloadAction<string>) => {
            state.selectedBusinessId = action.payload;
        },
        setFinancialYear: (state, action: PayloadAction<string>) => {
            state.selectedFinancialYear = action.payload;
        },
        completeKyc: state => {
            state.kycComplete = true;
        },
        setActiveSetup: (state, action: PayloadAction<GstSetup>) => {
            state.activeSetup = action.payload;
            state.selectedBusinessId = action.payload.gstin;
            state.selectedFinancialYear = action.payload.financialYear;
        },
        setKycBusinesses: (state, action: PayloadAction<KycBusiness[]>) => {
            state.kycBusinesses = action.payload;
        },
        setGstPortalUsername: (state, action: PayloadAction<string>) => {
            state.gstPortalUsername = action.payload;
        },
        resetKyc: () => initialState,
    },
});

export const {
    setPanDetails,
    setSelectedBusiness,
    setFinancialYear,
    completeKyc,
    setActiveSetup,
    setKycBusinesses,
    setGstPortalUsername,
    resetKyc,
} = taxMoreSlice.actions;

export default taxMoreSlice.reducer;
