import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../types';
import { categoryResponse, TransactionDiagnosticDetails, transactionResponse } from '../types/orders';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<transactionResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/orders/transactions`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    to: payload.to,
                    from: payload.from,
                    corporateId: payload.id,
                    categoryName: payload.category,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getCategories = async (payload: UserPayload & { searchText: string }) => {
    try {
        const resp: SuccessGenericResponse<categoryResponse> = await ApiClient.get(
            `user/general/report/categories`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const resendOrderEmail = async (payload: UserPayload & { corporateTxnId: string }) => {
    try {
        const resp: { status: boolean; message: string; responseCode: string } =
            await ApiClient.post(
                `${payload.userType}/${payload.userId}/payment-gateway/orders/resend-email`,
                { corporateTxnId: payload.corporateTxnId }
            );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getTransactionDiagnosticDetails = async (
    payload: UserPayload & { transactionId: number }
) => {
    try {
        const resp: SuccessGenericResponse<TransactionDiagnosticDetails> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/orders/transactions/${payload.transactionId}/details`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/orders/transactions/${payload.type}`,
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
