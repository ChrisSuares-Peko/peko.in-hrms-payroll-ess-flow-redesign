import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { IForm } from '../types/forms';
import { PricingType, QuoteConfig } from '../types/pricing';

type ApplicationState = {
    applicationId: string;
    formSchema: IForm | null;
    values: any;
    metrics: {
        visa: number;
        activity: number;
        shareholder: number;
    } | null;
    provider: any | null;
    countryData: any | null;
    currentPageIndex: string;
    pricingData: PricingType | null;
    pricingList: PricingType[] | null;
    quoteConfig: QuoteConfig | null;
};

const initialState: ApplicationState = {
    applicationId: '',
    formSchema: null,
    values: {},
    metrics: null,
    provider: null,
    countryData: null,
    currentPageIndex: '',
    pricingData: null,
    pricingList: null,
    quoteConfig: null,
};

const globalBusinessSetupApplicationSlice = createSlice({
    name: 'globalBusinessSetupApplication',
    initialState,
    reducers: {
        setFormSchema(state, action: PayloadAction<IForm>) {
            state.formSchema = action.payload;
        },

        saveFormValues(state, action: PayloadAction<any>) {
            state.values = action.payload;
        },

        setApplicationId(state, action: PayloadAction<string>) {
            state.applicationId = action.payload;
        },

        setMetrics(
            state,
            action: PayloadAction<{
                visa: number;
                activity: number;
                shareholder: number;
            }>
        ) {
            state.metrics = action.payload;
        },

        setProvider(state, action: PayloadAction<any>) {
            state.provider = action.payload;
        },

        setCountryData(state, action: PayloadAction<any>) {
            state.countryData = action.payload;
        },

        setCurrentPageIndex(state, action: PayloadAction<string>) {
            state.currentPageIndex = action.payload;
        },

        setPricingData(state, action: PayloadAction<PricingType | null>) {
            state.pricingData = action.payload;
        },

        setPricingList(state, action: PayloadAction<PricingType[] | null>) {
            state.pricingList = action.payload;
        },

        setQuoteConfig(state, action: PayloadAction<QuoteConfig | null>) {
            state.quoteConfig = action.payload;
        },

        resetApplication(state) {
            state.formSchema = null;
            state.values = {};
            state.metrics = null;
            state.provider = null;
            state.countryData = null;
            state.currentPageIndex = '';
            state.applicationId = '';
            state.pricingData = null;
            state.pricingList = null;
            state.quoteConfig = null;
        },
    },
});

export const {
    setFormSchema,
    saveFormValues,
    setMetrics,
    setProvider,
    setCountryData,
    setCurrentPageIndex,
    resetApplication,
    setApplicationId,
    setPricingData,
    setPricingList,
    setQuoteConfig,
} = globalBusinessSetupApplicationSlice.actions;

export default globalBusinessSetupApplicationSlice.reducer;
