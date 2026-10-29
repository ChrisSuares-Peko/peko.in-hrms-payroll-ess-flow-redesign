import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    EmailDomainData,
    EmailDomainPayload,
    getEmailDomain,
    updateEmailDomainStatusPayload,
    VendorApiResponse,
} from '../types/emailDomain';

export const getAllEmailDomain = async (payload: UserPayload & getEmailDomain) => {
    try {
        const resp: SuccessGenericResponse<EmailDomainData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software-subscriptions`,
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

export const createEmailDomain = async ({
    userId,
    userType,
    ...payload
}: UserPayload & EmailDomainPayload) => {
    try {
        delete payload.id;

        // delete payload.imageFormat;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/purchase/software-subscriptions`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateEmailDomain = async ({
    userId,
    userType,
    ...payload
}: UserPayload & EmailDomainPayload) => {
    try {
        const { id } = payload;
        delete payload.id;
        const resp: any = await ApiClient.put(
            `${userType}/${userId}/purchase/software-subscriptions/${id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getAllVendors = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<VendorApiResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software-subscriptions/vendors?searchText=`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateActiveStatusEmailDomain = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateEmailDomainStatusPayload) => {
    try {
        const { id, ...restPayload } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.patch(
            `${userType}/${userId}/purchase/software-subscriptions/${id}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (
    payload: UserPayload & { type: string; searchText: string; sort: string; sortField: string }
) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software-subscriptions/${payload.type}`,
            {
                params: {
                    searchText: payload.searchText,
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

export const deleteEmailDomainApi = async (
    payload: UserPayload & { productId: string | number }
) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/purchase/software-subscriptions/${payload.productId}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};
