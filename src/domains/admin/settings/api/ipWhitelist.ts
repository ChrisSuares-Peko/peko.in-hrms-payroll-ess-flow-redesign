import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { ipWhitelistResponse, activeResponse, categoryResponse } from '../types/ipWhitelist';

export const getAllData = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<ipWhitelistResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/ip-whitelist`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
                    partnerId: payload.partnerId || '',
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/ip-whitelist/documents/${payload.type}`,
            {
                params: {
                    orderCol: payload.sort,
                    searchText: payload.searchText,
                    partnerId: payload.partnerId || '',
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getUpdateStatus = async ({ userId, userType, ...payload }: UserPayload & any) => {
    try {
        const { ipId } = payload;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/ip-whitelist/update-status/${ipId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteDocument = async (payload: UserPayload & { docId: number }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/ip-whitelist/${payload.docId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createDocument = async ({ userId, userType, ...payload }: UserPayload & any) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<Document> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/ip-whitelist/`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateDocument = async ({ userId, userType, ...payload }: UserPayload & any) => {
    try {
        const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<Document> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/ip-whitelist/${id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getpartner = async (payload: UserPayload & { searchText: string }) => {
    try {
        const resp: SuccessGenericResponse<categoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/users/fetch-partner?q=${payload.searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
