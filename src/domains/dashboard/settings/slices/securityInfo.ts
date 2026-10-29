import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { SecurityInfoResponse } from '../types/security';

interface SecurityInfoState {
    data: SecurityInfoResponse | null;
    isLoading: boolean;
    refresh: boolean;
    isEditLoading?: boolean;
}

const initialState: SecurityInfoState = {
    data: null,
    isLoading: false,
    refresh: false,
    isEditLoading: false,
};

export const securityInfoSlice = createSlice({
    name: 'securityInfo',
    initialState,
    reducers: {
        setData: (state, action: PayloadAction<Partial<SecurityInfoState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { setData } = securityInfoSlice.actions;

export default securityInfoSlice.reducer;
