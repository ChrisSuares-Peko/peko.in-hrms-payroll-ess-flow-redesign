import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    getData,
    activeResponse,
    BannerData,
    updateStatus,
    DeviceTypeData,
    NewBanner,
    Banner,
} from '../types/banners';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<BannerData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/banner`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    deviceType: payload.deviceType,
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
            `${payload.userType}/${payload.userId}/others/banner/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    deviceType: payload.deviceType,
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
        const { bannerId } = payload;
        delete payload.bannerId;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.put(
            `${userType}/${userId}/others/banner//updateStatus/${bannerId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteDocument = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/banner/${payload.id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getDeviceType = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<DeviceTypeData> = await ApiClient.get(
            `/user/general/banner/deviceTypes`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createBanner = async ({ userId, userType, ...payload }: UserPayload & NewBanner) => {
    try {
        delete payload.id;

        if (!payload.partnerId || payload.partnerId === '') payload.partnerId = null;
        const resp: SuccessGenericResponse<Banner> = await ApiClient.post(
            `${userType}/${userId}/others/banner`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateBanner = async ({ userId, userType, ...payload }: UserPayload & NewBanner) => {
    try {
        const { id } = payload;
        delete payload.id;
        if (!payload.partnerId || payload.partnerId === '') payload.partnerId = null;

        const resp: SuccessGenericResponse<Banner> = await ApiClient.put(
            `${userType}/${userId}/others/banner/${id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
