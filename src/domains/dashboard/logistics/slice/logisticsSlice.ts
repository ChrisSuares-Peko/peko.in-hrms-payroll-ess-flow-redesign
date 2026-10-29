import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { Address, shipmentDetailsMin, shippingAmount } from '../types/index';

const initialState = {
    originAddress: {
        Line1: '',
        Line2: '',
        Line3: '',
        State: '',
        City: '',
        PostCode: '',
        CountryCode: 'IN',
        Description: '',
        Remark: '',
        id: 0,
    },
    destinationAddress: {
        Line1: '',
        Line2: '',
        Line3: '',
        State: '',
        City: '',
        CountryCode: 'IN',
        PostCode: '',
        Longitude: 0,
        Latitude: 0,
        Description: '',
        Remark: '',
    },
    shipmentDetails: {
        packageWeight: '0', // in grams
        serviceType: 'NORMAL',
        orderCategory: 'AnyThing',
        recieveSMS: true,
        orderDate: '',
    },
    shippingAmount: {
        charges: 0,
    },
    isComingFromDetails: false,
};

const logisticsSlice = createSlice({
    name: 'logistics',
    initialState,
    reducers: {
        setOriginAddress: (state, action: PayloadAction<Partial<Address>>) => {
            state.originAddress = { ...state.originAddress, ...action.payload };
        },
        setDestinationAddress: (state, action: PayloadAction<Partial<Address>>) => {
            state.destinationAddress = { ...state.destinationAddress, ...action.payload };
        },
        setShipmentDetails: (state, action: PayloadAction<Partial<shipmentDetailsMin>>) => {
            state.shipmentDetails = { ...state.shipmentDetails, ...action.payload };
        },
        setShippingAmount: (state, action: PayloadAction<Partial<shippingAmount>>) => {
            state.shippingAmount = { ...state.shippingAmount, ...action.payload };
        },
        setIsComingFromDetails: (state, action: PayloadAction<boolean>) => {
            state.isComingFromDetails = action.payload;
        },

        resetLogisticsDataState: () => initialState,
    },
});

export const {
    setOriginAddress,
    setDestinationAddress,
    setShipmentDetails,
    setShippingAmount,
    resetLogisticsDataState,
    setIsComingFromDetails,
} = logisticsSlice.actions;
export default logisticsSlice.reducer;
