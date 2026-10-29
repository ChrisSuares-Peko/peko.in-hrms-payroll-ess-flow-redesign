import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    CartDetailsResponse,
    ConfirmOrderResponse,
    InitOrderResponse,
    ValidateCartResponse,
} from '../types/cartTypes';

/** Cart totals + the latest pre-checkout ONDC seller validation (quotes), the
 *  Pay-time init result (final quotes + settlement terms) and the confirm
 *  result (placed orders). */
export type CartState = CartDetailsResponse & {
    validation: ValidateCartResponse | null;
    initialization: InitOrderResponse | null;
    confirmation: ConfirmOrderResponse | null;
};

const initialState: CartState = {
    items: [],
    count: 0,
    cartId: 0,
    itemsTotalAmount: 0,
    allowCheckout: false,
    grandTotal: 0,
    totalGst: 0,
    eligibleFreeShipping: 0,
    freeDelivery: false,
    shippingCharge: 0,
    validation: null,
    initialization: null,
    confirmation: null,
};

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setData: (state, action: PayloadAction<Partial<CartDetailsResponse>>) => {
            // Cart contents changed — previous validation/init/confirm are stale.
            state = {
                ...state,
                ...action.payload,
                validation: null,
                initialization: null,
                confirmation: null,
            };
            return state;
        },
        setValidation: (state, action: PayloadAction<ValidateCartResponse | null>) => {
            state.validation = action.payload;
        },
        setInitialization: (state, action: PayloadAction<InitOrderResponse | null>) => {
            state.initialization = action.payload;
        },
        setConfirmation: (state, action: PayloadAction<ConfirmOrderResponse | null>) => {
            state.confirmation = action.payload;
        },
    },
});

export const { setData, setValidation, setInitialization, setConfirmation } = cartSlice.actions;

export default cartSlice.reducer;
