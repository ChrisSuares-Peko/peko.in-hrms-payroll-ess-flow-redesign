import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { PurchasedListResponse } from '@customtypes/general';

interface ApiState {
    services: PurchasedListResponse | null;
}

const initialState: ApiState = {
    services: null,
};

export const subscriptionSlice = createSlice({
    name: 'subscriptions',
    initialState,
    reducers: {
        setSubscriptions: (state, action: PayloadAction<Partial<ApiState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { setSubscriptions } = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
