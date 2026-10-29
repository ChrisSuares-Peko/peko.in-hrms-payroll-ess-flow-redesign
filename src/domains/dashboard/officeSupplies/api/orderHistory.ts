import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CancelOrderRequestPayload,
    DownloadInvoiceRequestPayload,
    payloadUser,
    ProductReturnRequestPayload,
    ProductReturnRequestResponse,
    TransactionDetailsRequestPayload,
    TransactionDetailsResponse,
    TransactionsRequestPayload,
    TransactionsResponse,
} from '../types/orderHistory';

export const getTransactionsApi = async (payload: TransactionsRequestPayload) => {
    try {
        const { userId, userType, from, to, itemsPerPage, page, searchText, sort } = payload;
        const params = {
            from,
            to,
            searchText,
            sort,
            page,
            itemsPerPage,
        };
        const resp: SuccessGenericResponse<TransactionsResponse> = await ApiClient.get(
            `${userType}/${userId}/purchase/ecommerce/latestTransactions`,
            { params }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getTransactionDetailsApi = async (payload: TransactionDetailsRequestPayload) => {
    try {
        const { userId, userType, orderId } = payload;
        const resp: SuccessGenericResponse<TransactionDetailsResponse> = await ApiClient.get(
            `${userType}/${userId}/purchase/ecommerce/orderDetails/${orderId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const cancelOrderApi = async (payload: CancelOrderRequestPayload) => {
    try {
        const resp = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/cancelOrder?orderId=${payload.orderId}`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const productReturnApi = async (payload: ProductReturnRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<ProductReturnRequestResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/returnOrder?orderId=${payload.orderId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const downloadInvoiceApi = async (payload: DownloadInvoiceRequestPayload) => {
    try {
        const { userId, userType, transactionID, type } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/others/transactions/download/${transactionID}/${type}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getOtpOrderCancel = async (payload: payloadUser) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/cancelOrder/get-otp?scope=email`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
