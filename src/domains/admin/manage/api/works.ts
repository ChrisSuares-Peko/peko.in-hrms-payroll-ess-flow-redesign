import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    getData,
    activeResponse,
    WorkData,
    updateStatus,
    WorkResponse,
    getVendorsResponse,
    newWork,
} from '../types/works';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<WorkResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/works`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
                    partnerId: payload.partnerId,
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
            `${payload.userType}/${payload.userId}/officeAndBusiness/works/${payload.type}`,
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

export const getUpdateStatus = async (payload: UserPayload & updateStatus) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/officeAndBusiness/works/${payload.workId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteWork = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/works/${payload.id}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getVendorsApi = async (payload: UserPayload & { searchText: string }) => {
    try {
        const resp: SuccessGenericResponse<getVendorsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/works/vendors?searchText=${payload.searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createWork = async (payload: UserPayload & newWork) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<WorkData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/works`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateWork = async (payload: UserPayload & newWork) => {
    try {
        const resp: SuccessGenericResponse<WorkData> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/works/${payload.workId}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};
