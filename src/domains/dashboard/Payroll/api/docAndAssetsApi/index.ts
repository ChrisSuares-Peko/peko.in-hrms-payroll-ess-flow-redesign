import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AssetTypesResponse,
    DocResponse,
    DocumentsListingResponse,
    UserPayload,
    assetDeletePayload,
    assetDeleteResponse,
    assetPayload,
    assetResponse,
    assetsListingResponse,
    createAssetPayload,
    createDocPayload,
    docDeletePayload,
    documentPayload,
    employeePayload,
    employeeResponse,
    updateAssetPayload,
    updateDocPayload,
} from '../../types/docAndAssetsTypes';

export const docList = async (payload: documentPayload) => {
    try {
        const res: SuccessGenericResponse<DocumentsListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/documents`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    year: payload.year,
                    month: payload.month,
                    searchText: payload.searchText,
                    fullName: payload.employee,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

// export const employeeDocsList = async (payload: documentPayload) => {
//     try {
//         const res: SuccessGenericResponse<DocumentsListingResponse> = await ApiClient.get(
//             `${payload.userType}/${payload.userId}/payroll/documents/${payload.employeeId}`,
//             {
//                 params: {
//                     page: payload.page,
//                     limit: 12,
//                     year: payload.year,
//                     month: payload.month,
//                     searchText: payload.searchText,

//                 },
//             }
//         );
//         const { data } = res;
//         return data;
//     } catch (error) {
//         return false;
//     }
// };

export const createDocument = async (payload: createDocPayload & UserPayload) => {
    try {
        const res: SuccessGenericResponse<DocResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/documents`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const updateDocument = async (payload: updateDocPayload & UserPayload) => {
    try {
        const res: DocResponse = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/documents/${payload.documentId}/${payload.employeeId}`,
            payload
        );
        

        return res;
    } catch (error) {
        return false;
    }
};
export const deleteDocument = async (payload: docDeletePayload & UserPayload) => {
    try {
        const res: SuccessGenericResponse<DocResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payroll/documents/${payload.documentId}/${payload.employeeId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const assetList = async (payload: assetPayload) => {
    try {
        const res: SuccessGenericResponse<assetsListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/assets`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    year: payload.year,
                    month: payload.month,
                    searchText: payload.searchText,
                    status: payload.assetStatus,
                    assetType: payload.assetType,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createAsset = async (payload: createAssetPayload & UserPayload) => {
    try {
        const res: SuccessGenericResponse<assetResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/assets`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateAsset = async (payload: updateAssetPayload & UserPayload) => {
    try {
        const res: SuccessGenericResponse<DocResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/assets/${payload.aId}/${payload.employeeId}`,
            payload
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};
export const deleteAsset = async (payload: assetDeletePayload & UserPayload) => {
    try {
        const res: SuccessGenericResponse<assetDeleteResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payroll/assets/${payload.assetId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const assetTypeListing = async (payload: UserPayload) => {
    try {
        const res: SuccessGenericResponse<AssetTypesResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/assets/asset-types`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getEmployees = async (payload: employeePayload) => {
    try {
        const resp: SuccessGenericResponse<employeeResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/employee/current-employees?searchText=`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
