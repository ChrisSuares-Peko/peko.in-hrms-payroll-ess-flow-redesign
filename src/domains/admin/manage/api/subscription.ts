import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getOperators } from '../../settings/types/serviceOperator';
import {
    ApiResponseSubscriptions,
    BulkSoftwareUploadResponse,
    CategoryApiResponse,
    SoftwareBulkExcelTemplateResponse,
    SubscriptionBody,
    SubscriptionWithoutID,
    updateSubscriptionStatusPayload,
    VendorApiResponse,
} from '../types/subscription';

export const getSubscriptionData = async (payload: UserPayload & getOperators) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseSubscriptions> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software`,
            {
                params: {
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    sort: payload.sort,
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

export const getFileBufferReport = async (payload: UserPayload & getOperators) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software/${payload.type}`,
            {
                params: {
                    searchText: payload.searchText,
                    sort: payload.sort,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateSubscriptionStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateSubscriptionStatusPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/purchase/software/updateStatus/${payload.subscriptionId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const putUpdateSubscription = async ({
    userId,
    userType,
    ...payload
}: UserPayload & SubscriptionBody) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/purchase/software/${payload.id}`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const createSubscription = async ({
    userId,
    userType,
    ...payload
}: UserPayload & SubscriptionWithoutID) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<SubscriptionBody> = await ApiClient.post(
            `${userType}/${userId}/purchase/software`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteSubscription = async (
    payload: UserPayload & { subscriptionId: string | number }
) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/purchase/software/${payload.subscriptionId}`
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const getAllVendors = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<VendorApiResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software/vendors?searchText=`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getSubscriptionCategories = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<CategoryApiResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software/fetchAllCategories`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const SoftwareBulkExcelTemplateApi = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<SoftwareBulkExcelTemplateResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software/bulk-template`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const SoftwareBulkExcelUploadApi = async (payload: UserPayload & { file: File }) => {
    try {
        const formData = new FormData();
        formData.append('file', payload.file, payload.file.name);
        const resp: SuccessGenericResponse<BulkSoftwareUploadResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/software/bulk-excel-upload`,
            formData
        );
        const { data, responseCode, message } = resp;
        if (responseCode === '001') return message;
        return data;
    } catch (err) {
        return false;
    }
};

export const BulkSoftwareJSONUploadApi = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<BulkSoftwareUploadResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/software/bulk-json-upload`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
