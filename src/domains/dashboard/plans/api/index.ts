import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { TransactionDetailsPayload } from '../../payments/types';
import {
    AddonPricingResponse,
    AddOnPaymentRequestPayload,
    ApplyCouponPayload,
    ApplyCouponResponse,
    PackageDetailsApiResponse,
    PackagesData,
    PaymentGeneric,
    PaymentRequestPayload,
    PaymentResponse,
    PaytmCreateOrderResponse,
    SubscriptionDetailsResponse,
    SubscriptionPricingResponse,
    TableDataPackages,
    userPayload,
} from '../types/index';

export const getPackages = async () => {
    try {
        const resp: SuccessGenericResponse<PackagesData> = await ApiClient.get(
            `user/subscription/list-packages`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

// Static package config — package name, prices, services, etc.
export const getPackageDetails = async (packageId: number) => {
    try {
        const resp: SuccessGenericResponse<PackageDetailsApiResponse> = await ApiClient.get(
            `user/subscription/package-details`,
            {
                params: {
                    packageId,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

// Dynamic pricing — discount, addon recurring price, total payable. Lives in paymentGateway
// so the math is identical to validatePrice; updating one place keeps display and validator in sync.
export const getSubscriptionPricing = async ({
    userId,
    userType,
    packageId,
    billingType,
    couponCode,
}: {
    userId: number;
    userType: string;
    packageId: number;
    billingType: 'MONTHLY' | 'ANNUALLY';
    couponCode?: string;
}) => {
    try {
        const resp: SuccessGenericResponse<SubscriptionPricingResponse> = await ApiClient.get(
            `${userType}/${userId}/payment-gateway/cashfree-gateway/subscription-pricing`,
            {
                params: { packageId, billingType, couponCode },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getAddonPricing = async ({
    userId,
    userType,
    addonsAccessKey,
    quantity,
}: {
    userId: number;
    userType: string;
    addonsAccessKey: string;
    quantity: number;
}) => {
    try {
        const resp: SuccessGenericResponse<AddonPricingResponse> = await ApiClient.get(
            `${userType}/${userId}/payment-gateway/cashfree-gateway/addon-pricing`,
            {
                params: { addonsAccessKey, quantity },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const postPaymentRequest = async ({
    userId,
    userType,
    ...payload
}: (PaymentRequestPayload & userPayload) | (AddOnPaymentRequestPayload & userPayload)) => {
    try {
        const resp: SuccessGenericResponse<PaytmCreateOrderResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/cashfree-gateway/create-subscription-order`,
            payload
        );
        if (!resp.status) return false;
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getPackageTableDetails = async () => {
    try {
        const resp: SuccessGenericResponse<TableDataPackages> = await ApiClient.get(
            `user/subscription/list-table`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const postPaymentRequestForFree = async ({
    userId,
    userType,
    ...payload
}: PaymentRequestPayload & userPayload) => {
    try {
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/subscriptions/payment`,
            payload
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const completePaytmPayment = async (payload: PaymentGeneric & UserPayload) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/cashfree-gateway/complete`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const postApplyCoupon = async ({
    userId,
    userType,
    ...payload
}: ApplyCouponPayload & userPayload) => {
    try {
        const resp: SuccessGenericResponse<ApplyCouponResponse> = await ApiClient.post(
            `${userType}/${userId}/purchase/coupons`,
            payload
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const postAddonPaymentRequest = async ({
    userId,
    userType,
    ...payload
}: (PaymentRequestPayload & userPayload) | (AddOnPaymentRequestPayload & userPayload)) => {
    try {
        const resp: SuccessGenericResponse<PaytmCreateOrderResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/cashfree-gateway/create-addon-order`,
            payload
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const postAddonWalletPayment = async ({
    userId,
    userType,
    ...payload
}: Pick<AddOnPaymentRequestPayload, 'pgAmount' | 'addonsAccessKey' | 'packageId' | 'quantity'> &
    userPayload) => {
    try {
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/wallet-payments/addon-payment`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getTransactionDetails = async (payload: UserPayload & TransactionDetailsPayload) => {
    try {
        const resp: SuccessGenericResponse<SubscriptionDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/transactions/subscription/${payload.transactionId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
