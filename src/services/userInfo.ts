import {
    PurchasedListResponse,
    ServicesListResponse,
    SuccessGenericResponse,
    UserInfoResponse,
    UserPayload,
} from '@customtypes/general';

import { ApiClient } from './config';

export const getUserInfo = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<UserInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/walletDetails`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getUserServices = async () => {
    try {
        const resp: SuccessGenericResponse<ServicesListResponse & PurchasedListResponse> =
            await ApiClient.get(`user/services/serviceAccess`);
        const { data } = resp;

        // return {data:ADMIN_MOCK_CATEGORIZED_SERVICE}
        return data;
    } catch (err) {
        return false;
    }
};

export const getDocument = async ({ key, ...payload }: { key: string } & UserPayload) => {
    try {
        const res: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/document/${key}`
        );

        return res.data;
    } catch (error) {
        return false;
    }
};

export const getServiceSearchList = async (payload: UserPayload & { search: string }) => {
    try {
        const resp: SuccessGenericResponse<any[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/dashboard/search?q=${payload.search}`
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const setSearch = async (payload: UserPayload & { search: string }) => {
    try {
        const resp: SuccessGenericResponse<any[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/dashboard/store-history?q=${payload.search}`
        );
      

        return resp;
    } catch (err) {
        return false;
    }
};

export const getServiceSearchHistory = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<any[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/dashboard/recent-history`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
