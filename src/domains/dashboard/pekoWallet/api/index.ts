import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CommonFileBuffer,
    PaymentGeneric,
    PaymentRequestPayload,
    PaytmCreateOrderResponse,
    TransactionDetailsPayload,
    TransactionDetailsResponse,
    userPayload,
} from '../types';

export const completePaytmPayment = async (payload: PaymentGeneric & userPayload) => {
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

export const postPaymentRequest = async ({
    userId,
    userType,
    ...payload
}: PaymentRequestPayload & userPayload) => {
    try {
        const resp: SuccessGenericResponse<PaytmCreateOrderResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/cashfree-gateway/create-order`,
            payload
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
            `${userType}/${userId}/payment-gateway/pekoWallet/payment`,
            payload
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getAllTransaction = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/wallet/all`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    page: payload.page,
                    filter: payload.filter,
                    itemsPerPage: 10,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};

export const getFileBufferReport = async (payload: userPayload & any) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/wallet/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    to: payload.to,
                    from: payload.from,
                    vendorId: payload.id,
                    categoryName: payload.category,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getWalletDenomination = async ({ userId, userType }: userPayload) => {
    try {
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.get(
            `${userType}/${userId}/others/wallet/denominations`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getTransactionDetails = async (payload: userPayload & TransactionDetailsPayload) => {
    try {
        const resp: SuccessGenericResponse<TransactionDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/transactions/transaction/${payload.transactionId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
