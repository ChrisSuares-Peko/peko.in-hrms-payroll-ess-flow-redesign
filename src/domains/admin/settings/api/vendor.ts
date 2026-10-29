import { CommonFileBuffer, DropDown, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ApiResponseVendor,
    Vendor,
    VendorWithoutID,
    getVendors,
    updateVendorStatus,
} from '../types/vendors';

type IndianStatesResponse = {
    states: DropDown;
};

export const getIndianStatesApi = async () => {
    try {
        const resp: SuccessGenericResponse<IndianStatesResponse> = await ApiClient.get(
            'user/general/indian-states'
        );
        return resp.data?.states ?? [];
    } catch {
        return [];
    }
};

export const getVendorsData = async (payload: UserPayload & getVendors) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseVendor> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/vendor`,
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

export const getFileBufferReport = async (payload: UserPayload & getVendors) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/vendor/${payload.type}`,
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

export const putUpdateVendorStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateVendorStatus) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/purchase/vendor/updateStatus/${payload.vendorId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const putUpdateVendor = async ({ userId, userType, ...payload }: UserPayload & Vendor) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/purchase/vendor/${payload.id}`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const createVendor = async ({
    userId,
    userType,
    ...payload
}: UserPayload & VendorWithoutID) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<Vendor> = await ApiClient.post(
            `${userType}/${userId}/purchase/vendor`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
