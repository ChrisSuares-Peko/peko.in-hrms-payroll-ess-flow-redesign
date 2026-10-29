import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getOperators } from '../../settings/types/serviceOperator';
import {
    ApiResponseEsimPlans,
    BulkESIMUploadResponse,
    ESIMBulkExcelTemplateResponse,
    EsimPlan,
    country,
    countryDtls,
    updateStatus,
} from '../types/eSIM';

export const getEsimPlansData = async (payload: UserPayload & getOperators) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseEsimPlans> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/esim`,
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

export const putUpdateEsimPlan = async (payload: UserPayload & EsimPlan) => {
    try {
        const { id, userId, userType, ...rest } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/purchase/esim/${id}`,
            rest
        );
        return resp?.status;
    } catch (err) {
        return false;
    }
};

export const createEsimPlan = async ({ userId, userType, ...payload }: UserPayload & EsimPlan) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/purchase/esim`,
            payload
        );
        // return data;
        return resp?.status;
    } catch (err) {
        return false;
    }
};

export const updateEsimPlanStatus = async (payload: UserPayload & updateStatus) => {
    try {
        const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<ApiResponseEsimPlans> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/purchase/esim/status/${id}`,
            payload
        );
        return resp?.status;
    } catch (err) {
        return false;
    }
};

export const getCountriesApi = async (payload: UserPayload & { searchText: string }) => {
    try {
        const resp: SuccessGenericResponse<country[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/esim/coveragepprofiles?search=${payload.searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

//
export const deleteConnect = async (payload: UserPayload & getOperators) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseEsimPlans> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/esim`,
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
            `${payload.userType}/${payload.userId}/purchase/esim/download/${payload.type}`,
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

export const ESIMBulkExcelUploadApi = async (payload: UserPayload & { file: File }) => {
    try {
        const formData = new FormData();
        formData.append('file', payload.file, payload.file.name);
        const resp: SuccessGenericResponse<BulkESIMUploadResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/esim/bulk-excel-upload`,
            formData
        );
        const { data, responseCode, message } = resp;
        if (responseCode === '001') return message;
        return data;
    } catch (err) {
        return false;
    }
};

export const ESIMBulkExcelTemplateApi = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ESIMBulkExcelTemplateResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/esim/bulk-template`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getEsimPrice = async (payload: UserPayload & countryDtls) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/esim/getPriceEsim?coverageId=${payload.coverageId}&countryIso2=${payload.countryIso2}&indicator=${payload.indicator}&label=${payload.label}`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const syncTunzPlans = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/esim/tunz/sync`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
