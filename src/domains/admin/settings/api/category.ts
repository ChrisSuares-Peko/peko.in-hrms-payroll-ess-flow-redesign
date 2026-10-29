import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    getData,
    activeResponse,
    CategoryData,
    updateStatus,
    newCategory,
    CategoryResponse,
    getVendorsResponse,
} from '../types/category';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CategoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/categories/all`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
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

export const getFileBufferReport = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/categories/all/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getUpdateStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateStatus) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.put(
            `${userType}/${userId}/purchase/categories/updateStatus/${payload.categoryId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteCategory = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/purchase/categories/${payload.id}`
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const getVendorsApi = async (payload: UserPayload & { searchText: string }) => {
    try {
        const resp: SuccessGenericResponse<getVendorsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/vendor/fetchAllVendors?searchText=${payload.searchText}`
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
}: UserPayload & newCategory) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<CategoryData> = await ApiClient.post(
            `${userType}/${userId}/purchase/categories`,
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
}: UserPayload & newCategory) => {
    try {
        const resp: SuccessGenericResponse<CategoryData> = await ApiClient.put(
            `${userType}/${userId}/purchase/categories/${payload.id}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};
