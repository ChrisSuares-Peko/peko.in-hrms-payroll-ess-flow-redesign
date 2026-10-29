import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AssetListingPayload,
    AssetListingResponse,
    AssetCreateResponse,
    AssetCreatePayload,
    AssetUpdatePayload,
    AssetDeletePayload,
    AssetDocCreatePayload,
    AssetDocCreateResponse,
    AssetDocDeletePayload,
    AssetDocListingPayload,
    AssetDocListingResponse,
    AssetDocUpdatePayload,
    AssetUsageCreatePayload,
    AssetUsageCreateResponse,
    AssetUsageDeletePayload,
    AssetUsageListingPayload,
    AssetUsageListingResponse,
    AssetUsageUpdatePayload,
    SingleAssetDetailsPayload,
    SingleAssetDetailsResponse,
    LatestAssetUsageResponse,
    AssetsInfoResponse,
} from '../types/assets/index';

export const listAsset = async (payload: AssetListingPayload) => {
    try {
        const res: SuccessGenericResponse<AssetListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/assets`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const listAssetInfo = async (payload: AssetListingPayload) => {
    try {
        const res: SuccessGenericResponse<AssetsInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/assets/info`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getSingleAsset = async (payload: SingleAssetDetailsPayload) => {
    try {
        const res: SuccessGenericResponse<SingleAssetDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/assets/${payload.assetId}`
        );
        const { data } = res;
        return data;
    } catch (err) {
        return false;
    }
};
export const createAsset = async (payload: AssetCreatePayload) => {
    try {
        const res: SuccessGenericResponse<AssetCreateResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/assets`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateAsset = async (payload: AssetUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/assets/${payload.assetId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteAsset = async (payload: AssetDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/assets/${payload.assetId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const listAssetDoc = async (payload: AssetDocListingPayload) => {
    try {
        const res: SuccessGenericResponse<AssetDocListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/asset-details/docs/`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    assetId: payload.assetId,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createAssetDoc = async (payload: AssetDocCreatePayload) => {
    try {
        const res: SuccessGenericResponse<AssetDocCreateResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/asset-details/docs`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateAssetDoc = async (payload: AssetDocUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/asset-details/docs/${payload.docId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteAssetDoc = async (payload: AssetDocDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/asset-details/docs/${payload.docId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const listUsageHistory = async (payload: AssetUsageListingPayload) => {
    try {
        const res: SuccessGenericResponse<AssetUsageListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/asset-details/usage-history/`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    assetId: payload.assetId,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createUsageHistory = async ({
    userId,
    userType,
    ...payload
}: AssetUsageCreatePayload) => {
    try {
        const res: SuccessGenericResponse<AssetUsageCreateResponse> = await ApiClient.patch(
            `${userType}/${userId}/officeAndBusiness/peko-cloud/assets/assign`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateUsageHistory = async (payload: AssetUsageUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/asset-details/usage-history/${payload.usageId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteUsageHistory = async (payload: AssetUsageDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/asset-details/usage-history/${payload.usageId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const getLatestAssetUsage = async (payload: SingleAssetDetailsPayload) => {
    try {
        const res: SuccessGenericResponse<LatestAssetUsageResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/asset-details/usage-history/latest`,
            {
                params: {
                    assetId: payload.assetId,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (err) {
        return false;
    }
};
