import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ApiResponseOperator,
    IServiceTypeListingResponse,
    IVendorListingResponse,
    OperatorWithoutID,
    getOperators,
    serviceOperator,
    updateOperatorStatus,
    vendorListingPayload,
} from '../types/serviceOperator';

export const getServiceOperatorsData = async (payload: UserPayload & getOperators) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseOperator> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/serviceOperators`,
            {
                params: {
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    deviceType: payload.deviceType,
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
            `${payload.userType}/${payload.userId}/others/serviceOperators/${payload.type}`,
            {
                params: {
                    searchText: payload.searchText,
                    deviceType: payload.deviceType,
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

export const putUpdateOperatorStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateOperatorStatus) => {
    try {
        const { operatorId } = payload;
        delete payload.operatorId;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/others/serviceOperators/updateStatus/${operatorId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const vendorListing = async ({
    userType,
    userId,
    searchText,
}: UserPayload & vendorListingPayload) => {
    try {
        const res: SuccessGenericResponse<IVendorListingResponse> = await ApiClient.get(
            `${userType}/${userId}/purchase/vendor/fetchAllVendors`,
            {
                params: {
                    searchText: searchText || '',
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const serviceTypeListing = async () => {
    try {
        const res: SuccessGenericResponse<IServiceTypeListingResponse> = await ApiClient.get(
            `/user/general/serviceOperators/serviceType`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const putUpdateServiceOperator = async ({
    userId,
    userType,
    ...payload
}: UserPayload & serviceOperator) => {
    try {
        if (!payload.serviceImage) delete payload.serviceImage;
        const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/others/serviceOperators/${id}`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const createServiceOperator = async ({
    userId,
    userType,
    ...payload
}: UserPayload & OperatorWithoutID) => {
    try {
        if (!payload.serviceImage) delete payload.serviceImage;
        delete payload.id;
        const resp: SuccessGenericResponse<serviceOperator> = await ApiClient.post(
            `${userType}/${userId}/others/serviceOperators`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
