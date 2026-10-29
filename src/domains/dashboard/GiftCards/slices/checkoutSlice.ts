import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { GiftCardOrderTypes, SelectedEmployee } from '../types/employee';
import { userDetailsResponse } from '../types/types';

interface FormData {
    amount: string;
    quantity: string;
    orderType: GiftCardOrderTypes;
}

interface ItemData {
    items: {
        product_id: number;
        mrp: number;
        selling_price: number;
        qty: number;
    }[];
    total_selling_price: number;
}

interface QuantityUpdate {
    quantity: string;
}

interface ProductData {
    productId?: string;
    product_image?: string;
    product_name?: string;
    id?: number;
    accessKey: string;
    brand_logo?: string;
    mrp?: string;
    serviceOperatorId?: number;
}
interface AddressData {
    receiverFirstName: string;
    // receiverLastName: string;
    // gender: string;
    receiverEmail: string;
    // receiverMobile: string;
    // postcode: string;
    senderName: string;
    // senderEmail: string;
    message: string;
    employee: SelectedEmployee[];
}

const initialState = {
    formDetails: {
        quantity: '',
        amount: '',
        product: '',
        orderType: GiftCardOrderTypes.BUYFOROTHER,
    },

    productDetails: {
        product_id: '',
        product_image: '',
        product_name: '',
        id: 0,
        accessKey: '',
        serviceOperatorId: undefined as number | undefined,
    },
    subTotal: '' as string | number | undefined,
    addressDetails: {
        employee: [],
        receiverFirstName: '',
        receiverLastName: '',
        gender: '',
        receiverEmail: '',
        receiverMobile: '',
        postcode: '',
        senderName: '',
        senderEmail: '',
        message: '',
    } as AddressData,
    userDetails: {
        addressId: 0,
        addressLine1: '',
        addressLine2: '',
        userName: '',
        userEmail: '',
        userCountry: '',
    },
    itemDetails: {
        items: [
            {
                product_id: 0,
                mrp: 0,
                selling_price: 0,
                qty: 0,
            },
        ],
        total_selling_price: 0,
    },

    gCardIdDetail: '',

    totalData: 0,

    // Set only by an explicit "Buy Again" click (order history) right before
    // navigating to Details — distinguishes that from simply revisiting the same
    // product's page with stale formDetails/addressDetails still sitting in redux
    // from a previous, uncompleted session. Consumed (and cleared) on read.
    isBuyAgain: false,

    // Set right before navigating to the payment page after a successful Buy Now —
    // distinguishes "the user is resuming this exact in-progress purchase after
    // going to payment and back" from "the user picked this same product again from
    // a listing page", which should start fresh even though the id/amount still
    // happen to match. Consumed (and cleared) on read, same as isBuyAgain.
    isResuming: false,
};

const checkoutSlice = createSlice({
    name: 'giftCardCheckout',
    initialState,
    reducers: {
        setFormData: (state, action: PayloadAction<Partial<FormData>>) => {
            state.formDetails = { ...state.formDetails, ...action.payload };
            const { quantity, amount } = state.formDetails;
            const product = parseInt(quantity, 10) * parseFloat(amount);
            state.formDetails.product = product.toString();
        },

        setUpdateQuantity: (state, action: PayloadAction<QuantityUpdate>) => {
            state.formDetails = { ...state.formDetails, ...action.payload };
            const { quantity, amount } = state.formDetails;
            const product = parseInt(quantity, 10) * parseFloat(amount);
            state.formDetails.product = product.toString();
        },

        setProductData: (state, action: PayloadAction<ProductData>) => {
            state.productDetails = { ...state.productDetails, ...action.payload };
        },

        setAddressData: (state, action: PayloadAction<AddressData>) => {
            state.addressDetails = { ...state.addressDetails, ...action.payload };
        },
        resetsetAddressData: state => {
            state.addressDetails = initialState.addressDetails;
            return state;
        },
        resetFormData: state => {
            state.formDetails = initialState.formDetails;
        },
        setBuyAgain: (state, action: PayloadAction<boolean>) => {
            state.isBuyAgain = action.payload;
        },
        setResuming: (state, action: PayloadAction<boolean>) => {
            state.isResuming = action.payload;
        },
        setUserDetails: (state, action: PayloadAction<userDetailsResponse | undefined>) => {
            state.userDetails = { ...state.userDetails, ...action.payload };
        },
        setItemData: (state, action: PayloadAction<ItemData>) => {
            state.itemDetails = { ...state.itemDetails, ...action.payload };
        },
        setSubTotal: (state, action: PayloadAction<number | undefined | string>) => {
            state.subTotal = action.payload;
        },

        setCardId: (state, action: PayloadAction<string>) => {
            state.gCardIdDetail = action.payload;
        },

        setTotalData: (state, action: PayloadAction<number>) => {
            state.totalData = action.payload;
        },
        resetData: () => initialState,
    },
});

export const {
    setFormData,
    setProductData,
    setAddressData,
    setUserDetails,
    setItemData,
    setSubTotal,
    setUpdateQuantity,
    resetData,
    resetsetAddressData,
    resetFormData,
    setBuyAgain,
    setResuming,
} = checkoutSlice.actions;
export default checkoutSlice.reducer;
