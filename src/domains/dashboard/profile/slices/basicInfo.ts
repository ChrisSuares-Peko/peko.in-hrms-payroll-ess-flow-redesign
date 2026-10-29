import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { BasicInfoResponse } from '../types/index';

interface BasicInfoState {
    data: BasicInfoResponse | null;
    isLoading: boolean;
    refresh: boolean;
    isEditLoading: boolean;
}

const initialState: BasicInfoState = {
    data: null,
    isLoading: false,
    refresh: false,
    isEditLoading: false,
};

export const basicInfoSlice = createSlice({
    name: 'basicInfo',
    initialState,
    reducers: {
        setData: (state, action: PayloadAction<Partial<BasicInfoState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { setData } = basicInfoSlice.actions;

export default basicInfoSlice.reducer;
