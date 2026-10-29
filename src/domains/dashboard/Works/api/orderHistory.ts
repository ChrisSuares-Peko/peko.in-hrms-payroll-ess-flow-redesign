import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    TransactionDetailsRequestPayload,
    TransactionDetailsResponse,
    TransactionsRequestPayload,
    TransactionsResponse,
} from '../type/orderHistory';

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
            `${userType}/${userId}/officeAndBusiness/works/orders`,
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
            `${userType}/${userId}/officeAndBusiness/works/orders/details/${orderId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
