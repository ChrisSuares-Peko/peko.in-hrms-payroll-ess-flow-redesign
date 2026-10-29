import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getOperators } from '../../settings/types/serviceOperator';
import {
    ApiResponseSubscriptionPlans,
    BulkSoftwarePlansUploadResponse,
    FetchSoftwareApiResponse,
    SoftwarePlansBulkTemplateResponse,
    SubscriptionPlan,
    SubscriptionPlanWithoutID,
    updateSubscriptionPlanStatusPayload,
} from '../types/subscriptionPlans';

export const getSubscriptionPlansData = async (payload: UserPayload & getOperators) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseSubscriptionPlans> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/plans`,
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
            `${payload.userType}/${payload.userId}/purchase/plans/${payload.type}`,
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

export const updateSubscriptionPlansStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateSubscriptionPlanStatusPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/purchase/plans/updateStatus/${payload.subscriptionId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const putUpdateSubscriptionPlan = async ({
    userId,
    userType,
    ...payload
}: UserPayload & SubscriptionPlan) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/purchase/plans/${payload.id}`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const createSubscriptionPlan = async ({
    userId,
    userType,
    ...payload
}: UserPayload & SubscriptionPlanWithoutID) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<SubscriptionPlan> = await ApiClient.post(
            `${userType}/${userId}/purchase/plans`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteSubscriptionPlan = async (
    payload: UserPayload & { subscriptionId: string | number }
) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/purchase/plans/${payload.subscriptionId}`
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const getAllSoftwareProducts = async (payload: UserPayload & { searchText: string }) => {
    try {
        const resp: SuccessGenericResponse<FetchSoftwareApiResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/plans/softwares?q=${payload.searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const SoftwarePlansBulkTemplateApi = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<SoftwarePlansBulkTemplateResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/plans/bulk-template`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const SoftwarePlansBulkUploadApi = async (payload: UserPayload & { file: File }) => {
    try {
        const formData = new FormData();
        formData.append('file', payload.file, payload.file.name);
        const resp: SuccessGenericResponse<BulkSoftwarePlansUploadResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/plans/bulk-excel-upload`,
            formData
        );
        const { data, responseCode, message } = resp;
        if (responseCode === '001') return message;
        return data;
    } catch (err) {
        return false;
    }
};

export const BulkSoftwarePlansJSONUploadApi = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<BulkSoftwarePlansUploadResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/plans/bulk-json-upload`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
