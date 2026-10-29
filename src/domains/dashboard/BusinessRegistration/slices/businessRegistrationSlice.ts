import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ApplicationPayload, BusinessRegistrationState } from '../types';

const initialState: BusinessRegistrationState = {
    currentApplication: {},
    submittedApplication: null,
    isLoading: false,
    error: null,
};

const businessRegistrationSlice = createSlice({
    name: 'businessRegistration',
    initialState,
    reducers: {
        updateApplicationData: (
            state,
            action: PayloadAction<Partial<ApplicationPayload>>
        ) => {
            state.currentApplication = {
                ...state.currentApplication,
                ...action.payload,
            };
        },
        setSubmittedApplication: (state, action: PayloadAction<unknown>) => {
            state.submittedApplication = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearCurrentApplication: state => {
            state.currentApplication = {};
            state.submittedApplication = null;
        },
        clearBusinessRegistration: () => initialState,
    },
});

export const businessRegistrationReducer = businessRegistrationSlice.reducer;
export const {
    updateApplicationData,
    setSubmittedApplication,
    setLoading,
    setError,
    clearCurrentApplication,
    clearBusinessRegistration,
} = businessRegistrationSlice.actions;
