import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AllSubscriptionCodeResponse,
    CodesFilterType,
    NewActivationCode,
    SubscriptionCode,
} from '../types/subscriptionCodes';

export const getAllActivationCodes = async (payload: UserPayload & CodesFilterType) => {
    try {
        const resp: SuccessGenericResponse<AllSubscriptionCodeResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/subscription-code`,
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

export const createActivationCodeApi = async ({
    userId,
    userType,
    ...payload
}: UserPayload & NewActivationCode) => {
    try {
        const resp: SuccessGenericResponse<SubscriptionCode> = await ApiClient.post(
            `${userType}/${userId}/purchase/subscription-code`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateActivationCodeApi = async ({
    userId,
    userType,
    ...payload
}: UserPayload & NewActivationCode) => {
    try {
        const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<SubscriptionCode> = await ApiClient.put(
            `${userType}/${userId}/purchase/subscription-code/${id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & { rowId: number; status: boolean }) => {
    try {
        const { rowId, ...rest } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/purchase/subscription-code/update-status/${rowId}`,
            rest
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteCode = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/purchase/subscription-code/${payload.id}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getFileBufferSubscriptionCode = async (payload: UserPayload & CodesFilterType) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/subscription-code/download/${payload.type}`,
            {
                params: {
                    partnerId: payload.partnerId,
                    searchText: payload.searchText,
                    type: payload.type,
                    // to: payload.to,
                    // from: payload.from,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
