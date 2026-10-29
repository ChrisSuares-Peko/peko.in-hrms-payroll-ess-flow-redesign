import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CategoryPostType,
    CategoryUpdatePayload,
    Document,
    DocumentData,
    DocumentUpdateRequest,
    PayrollCategoryData,
    activeResponse,
    getPayrollDocs,
    updateStatus,
} from '../types/payrollDocTypes';

export const getAllData = async (payload: UserPayload & getPayrollDocs) => {
    try {
        const resp: SuccessGenericResponse<DocumentData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/payrollDocs/documents`,
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
        const documentId = payload.docId;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/payrollDocs/${documentId}/status`,
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
            `${payload.userType}/${payload.userId}/others/payrollDocs/${payload.docId}`
        );
        return resp;
    } catch (err) {
        console.log(err, 'rror');
        return false;
    }
};

export const getCategories = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<PayrollCategoryData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/payrollDocs/categories`
        );

        return resp;
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
            `${userType}/${userId}/others/payrollDocs/`,
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
        const documentId = id;
        const resp: SuccessGenericResponse<Document> = await ApiClient.put(
            `${userType}/${userId}/others/payrollDocs/${documentId}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & getPayrollDocs) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/payrollDocs/${payload.type}`,
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

export const createCategory = async ({
    userId,
    userType,
    ...payload
}: UserPayload & CategoryPostType) => {
    try {
        const resp: SuccessGenericResponse<Document> = await ApiClient.post(
            `${userType}/${userId}/others/payrollDocs/category`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateCategory = async ({
    userId,
    userType,
    ...payload
}: UserPayload & CategoryUpdatePayload) => {
    try {
        const { id } = payload;
        const categoryId = id ?? '';
        const resp: SuccessGenericResponse<Document> = await ApiClient.put(
            `${userType}/${userId}/others/payrollDocs/category/${categoryId}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteCategory = async (payload: UserPayload & { categoryId: number }) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/payrollDocs/category/${payload.categoryId}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};
