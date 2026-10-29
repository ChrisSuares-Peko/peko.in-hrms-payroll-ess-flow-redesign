import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
    IncorporationState,
    LandingConfigResponse,
    ApplicationPayload,
    ApplicationResponse,
    Application,
} from '../types';

const initialState: IncorporationState = {
    landingConfig: null,
    currentApplication: {},
    selectedServices: [],
    submittedApplication: null,
    applications: [],
    currentApplicationDetail: null,
    isLoading: false,
    error: null,
};

const incorporationSlice = createSlice({
    name: 'incorporation',
    initialState,
    reducers: {
        setLandingConfig: (
            state,
            action: PayloadAction<LandingConfigResponse>
        ) => {
            state.landingConfig = action.payload;
        },
        setSubmittedApplication: (state, action: PayloadAction<ApplicationResponse>) => {
            state.submittedApplication = action.payload;
        },
        setSelectedServices: (state, action: PayloadAction<string[]>) => {
            state.selectedServices = action.payload;
        },
        updateApplicationData: (
            state,
            action: PayloadAction<Partial<ApplicationPayload>>
        ) => {
            state.currentApplication = {
                ...state.currentApplication,
                ...action.payload,
            };
        },
        setApplications: (state, action: PayloadAction<Application[]>) => {
            state.applications = action.payload;
        },
        setCurrentApplicationDetail: (
            state,
            action: PayloadAction<Application | null>
        ) => {
            state.currentApplicationDetail = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearCurrentApplication: state => {
            state.currentApplication = {};
            state.selectedServices = [];
            state.submittedApplication = null;
        },
        clearFormData: state => {
            state.currentApplication = {};
            state.selectedServices = [];
        },
        clearIncorporation: () => initialState,
    },
});

export const incorporationReducer = incorporationSlice.reducer;
export const {
    setLandingConfig,
    setSubmittedApplication,
    setSelectedServices,
    updateApplicationData,
    setApplications,
    setCurrentApplicationDetail,
    setLoading,
    setError,
    clearCurrentApplication,
    clearFormData,
    clearIncorporation,
} = incorporationSlice.actions;
