import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialState = {
    prepaid: {
        serviceProvider: '',
        circle: '',
        mobileNumber: '',
        amount: '',
    },
};

export const prepaidSlice = createSlice({
    name: 'prepaidSlice',
    initialState,
    reducers: {
        setPrepaid: (state, action: PayloadAction<Partial<any>>) => {
            state.prepaid = { ...state.prepaid, ...action.payload };
        },
        clearPrepaid: () => initialState,
    },
});

export const { setPrepaid, clearPrepaid } = prepaidSlice.actions;

export default prepaidSlice.reducer;
