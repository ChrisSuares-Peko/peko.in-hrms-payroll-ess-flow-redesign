import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import type {
    CatalogItemApiData,
    CreateCatalogPayload,
    FetchCatalogPayload,
    FetchCatalogResponse,
    UpdateCatalogPayload,
} from '../types/catalog';

export const fetchCatalog = async (
    payload: FetchCatalogPayload
): Promise<FetchCatalogResponse | false> => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<FetchCatalogResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/catalog`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const createCatalogItem = async (
    payload: CreateCatalogPayload
): Promise<CatalogItemApiData | false> => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<CatalogItemApiData> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/catalog`,
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateCatalogItem = async (
    payload: UpdateCatalogPayload
): Promise<CatalogItemApiData | false> => {
    try {
        const { userId, userType, catalogId, ...body } = payload;
        const resp: SuccessGenericResponse<CatalogItemApiData> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/catalog/${catalogId}`,
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const deleteCatalogItem = async (payload: {
    userId: number;
    userType: string;
    catalogId: number;
}): Promise<boolean> => {
    try {
        const { userId, userType, catalogId } = payload;
        await ApiClient.delete(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/catalog/${catalogId}`
        );
        return true;
    } catch {
        return false;
    }
};
