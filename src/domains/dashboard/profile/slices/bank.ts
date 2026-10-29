import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { BankDetail } from '../types/index';

interface BankState {
    tableData: BankDetail[] | [];
    isLoading: boolean;
    refresh: boolean;
    isDeleteLoading?: boolean;
    isEditLoading?: boolean;
    id?: number;
}

const initialState: BankState = {
    tableData: [],
    isLoading: false,
    refresh: false,
    isDeleteLoading: false,
    isEditLoading: false,
};

export const bankSlice = createSlice({
    name: 'bank',
    initialState,
    reducers: {
        setData: (state, action: PayloadAction<Partial<BankState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { setData } = bankSlice.actions;

export default bankSlice.reducer;
