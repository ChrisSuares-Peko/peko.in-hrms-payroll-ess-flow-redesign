import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    categoryListingResponse,
    reportListingPayload,
    reportListingResponse,
    downloadInvoicePayload,
    ShedulerPayload,
    ShedulerResponse,
    updateShedulerPayload,
    updateShedulerResponse,
    downloadResponse,
    getData,
    transactionResponse,
    filterState,
    subscriptionListingResponse,
    subscriptionReportListingResponse,
} from '../types/index';

export const reportListing = async (payload: reportListingPayload) => {
    try {
        const res: SuccessGenericResponse<reportListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions/orders`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    categoryName: encodeURIComponent(payload.categoryName) || '',
                    accessKey: payload.accessKey || '',
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

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<transactionResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions/orders`,
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
export const CashbackListing = async (payload: reportListingPayload) => {
    try {
        const res: SuccessGenericResponse<reportListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions/cashback`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    categoryName: encodeURIComponent(payload.categoryName) || '',
                    searchText: payload.searchText,
                    sort: payload.sort,
                    page: payload.page,
                    filter: payload.filter,
                    sortField: payload.sortField,
                    itemsPerPage: 10,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const categoryListing = async () => {
    try {
        const res: SuccessGenericResponse<categoryListingResponse> = await ApiClient.get(
            'user/general/report/categories'
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const downloadInvoice = async (payload: downloadInvoicePayload) => {
    try {
        const res: SuccessGenericResponse<downloadResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions/download/${payload.transactionID}/${payload.type}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getAllShedulerData = async (payload: ShedulerPayload) => {
    try {
        const res: SuccessGenericResponse<ShedulerResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/scheduler/reportSetting/getEmails`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateSheduler = async (payload: updateShedulerPayload) => {
    try {
        const { userId, userType, route, ...restData } = payload;
        const res: SuccessGenericResponse<updateShedulerResponse> = await ApiClient.patch(
            `${userType}/${userId}/scheduler/reportSetting/${route}`,
            restData
        );
        const { message } = res;
        return message;
    } catch (error) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & filterState) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions/orders/${payload.type}`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    categoryName: encodeURIComponent(payload.category) || '',
                    accessKey: payload.accessKey || '',
                    searchText: payload.searchText,
                    sort: payload.sort,
                    page: payload.page,
                    corporateId: payload.userId,
                    itemsPerPage: 10,
                    title: payload.title,
                    filter: payload.filter,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getSubscriptionFileBufferReport = async (payload: UserPayload & filterState) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions/subscriptionOrders/${payload.type}`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    categoryName: encodeURIComponent(payload.category) || '',
                    searchText: payload.searchText,
                    sort: payload.sort,
                    page: payload.page,
                    corporateId: payload.userId,
                    itemsPerPage: 10,
                    title: payload.title,
                    filter: payload.filter,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const subscriptionListing = async () => {
    try {
        const res: SuccessGenericResponse<subscriptionListingResponse> = await ApiClient.get(
            'user/general/report/subscription'
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const subscriptionTransactionListing = async (payload: reportListingPayload) => {
    try {
        const res: SuccessGenericResponse<subscriptionReportListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions/subscriptionOrders`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    categoryName: encodeURIComponent(payload.categoryName) || '',
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

export const subsciptionDownloadInvoice = async (payload: downloadInvoicePayload) => {
    try {
        const res: SuccessGenericResponse<downloadResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions/subscriptionOrdersDownload/${payload.transactionID}/${payload.type}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
