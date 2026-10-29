import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ApiResponsePackage,
    PackageFilters,
    PackageID,
    PackageWithoutID,
    Packages,
    updatePackageStatus,
} from '../types/servicePackage';

export const getPackagesData = async (payload: UserPayload & PackageFilters) => {
    try {
        const resp: SuccessGenericResponse<ApiResponsePackage> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/package/all`,
            {
                params: {
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    partnerId: payload.partnerId,
                    type: '2',
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & PackageFilters) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/package/${payload.type}`,
            {
                params: {
                    searchText: payload.searchText,
                    sort: payload.sort,
                    packageType: '2',
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

export const putUpdatePackageStatus = async ({
    userId,
    userType,
    packageId,
    ...payload
}: UserPayload & updatePackageStatus) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/others/package/updateStatus/${packageId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const putUpdatePackage = async ({
    userId,
    userType,
    ...payload
}: UserPayload & Packages) => {
    try {
        const { id, ...rest } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/others/package/${id}`,
            rest
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createPackage = async ({
    userId,
    userType,
    ...payload
}: UserPayload & PackageWithoutID) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<Packages> = await ApiClient.post(
            `${userType}/${userId}/others/package`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deletePackage = async (payload: UserPayload & PackageID) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/package/${payload.packageId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
