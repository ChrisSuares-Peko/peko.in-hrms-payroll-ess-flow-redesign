import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { OrderDetailsSlice, WorksSlice } from '../type/orderHistory';

const initialState: WorksSlice = {
    orderDetails: {
        planDetails: {
            name: null,
            description: null,
            price: null,
            billingCycle: null,
            features: null,
        },
        name: null,
        email: null,
        mobile: null,
        status: null,
        refresh: null,
        crmContactDetails: null,
        showCRMDetails: null,
    },
    formData: {
        pocName: '',
        email: '',
        mobile: '',
        requirement: '',
    },
};

export const worksSlice = createSlice({
    name: 'works',
    initialState,
    reducers: {
        setOrderDetails: (state, action: PayloadAction<Partial<OrderDetailsSlice>>) => {
            state.orderDetails = { ...state.orderDetails, ...action.payload };
        },
        setFormData: (state, action: PayloadAction<any>) => {
            state.formData = { ...state.formData, ...action.payload };
        },
        resetFormData: state => {
            state.formData = initialState.formData;
        },
    },
});

export const { setOrderDetails, setFormData, resetFormData } = worksSlice.actions;

export default worksSlice.reducer;
