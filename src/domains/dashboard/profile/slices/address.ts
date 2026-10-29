import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { AddressDetail } from '../types/index';

interface AddressState {
    tableData: AddressDetail[] | [];
    isLoading: boolean;
    refresh: boolean;
    isDeleteLoading?: boolean;
    id?: number;
}

const initialState: AddressState = {
    tableData: [],
    isLoading: false,
    refresh: false,
    isDeleteLoading: false,
};

export const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        setData: (state, action: PayloadAction<Partial<AddressState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { setData } = addressSlice.actions;

export default addressSlice.reducer;
