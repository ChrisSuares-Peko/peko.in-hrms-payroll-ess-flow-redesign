import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { CompanyInfoResponse } from '../types/index';

interface CompanyInfoState {
    data: CompanyInfoResponse | null;
    isLoading: boolean;
    refresh: boolean;
    isEditLoading: boolean;
}

const initialState: CompanyInfoState = {
    data: null,
    isLoading: false,
    refresh: false,
    isEditLoading: false,
};

export const companyInfoSlice = createSlice({
    name: 'companyInfo',
    initialState,
    reducers: {
        setData: (state, action: PayloadAction<Partial<CompanyInfoState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
        setRefresh: (state, action: PayloadAction) => {
            state = { ...state, refresh: !state.refresh };
            return state;
        },
        setUpdateKycStatus: (state, action: PayloadAction<any>) => {
            state.data = { ...state.data, ...action.payload };
            return state;
        },
    },
});

export const { setData, setRefresh, setUpdateKycStatus } = companyInfoSlice.actions;

export default companyInfoSlice.reducer;
