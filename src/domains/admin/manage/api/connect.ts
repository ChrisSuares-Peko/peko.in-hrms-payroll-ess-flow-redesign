import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getOperators } from '../../settings/types/serviceOperator';
import {
    ApiResponseConnect,
    ApiResponseConnectCategory,
    ConnectBody,
    ConnectID,
    ConnectWithoutID,
    updateConnectStatusPayload,
} from '../types/connect';

export const getConnectData = async (payload: UserPayload & getOperators) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseConnect> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-connect`,
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
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-connect/${payload.type}`,
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

export const updateConnectStatus = async (payload: UserPayload & updateConnectStatusPayload) => {
    try {
        const { connectId } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-connect/update-status/${connectId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const putUpdateConnect = async (payload: UserPayload & ConnectBody) => {
    try {
        const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-connect/${id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createConnect = async ({
    userId,
    userType,
    ...payload
}: UserPayload & ConnectWithoutID) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<ConnectBody> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/peko-connect`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteConnect = async (payload: UserPayload & ConnectID) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-connect/${payload.connectId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getConnectCategory = async () => {
    try {
        const resp: SuccessGenericResponse<ApiResponseConnectCategory> = await ApiClient.get(
            `user/general/pekoConnect/category`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
