import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CategoryData,
    Document,
    DocumentData,
    DocumentUpdateRequest,
    activeResponse,
    getEDocs,
    updateStatus,
} from '../types/edocTypes';

export const getAllData = async (payload: UserPayload & getEDocs) => {
    try {
        const resp: SuccessGenericResponse<DocumentData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/edocs/documents`,
            {
                params: {
                    orderCol: payload.sort,
                    page: payload.page,
                    pageSize: payload.itemsPerPage,
                    searchText: payload.searchText,
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

export const getUpdateStatus = async (payload: UserPayload & updateStatus) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/edocs/updateStatus/${payload.docId}`,
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
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/edocs/${payload.docId}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getCategories = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<CategoryData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/edocs/categories`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createDocument = async ({
    userId,
    userType,
    ...payload
}: UserPayload & DocumentUpdateRequest) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<Document> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/edocs/`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateDocument = async ({
    userId,
    userType,
    ...payload
}: UserPayload & DocumentUpdateRequest) => {
    try {
        const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<Document> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/edocs/${id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & getEDocs) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/edocs/documents/${payload.type}`,
            {
                params: {
                    orderCol: payload.sort,
                    search: payload.searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
