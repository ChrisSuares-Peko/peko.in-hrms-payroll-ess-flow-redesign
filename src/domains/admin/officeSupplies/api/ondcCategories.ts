import { UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CreateOndcCategoryPayload,
    OndcCategoryTreeRow,
    UpdateOndcCategoryPayload,
} from '../types/ondcCategory';

export const getOndcCategoriesTree = async (payload: UserPayload) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/categories`,
            { params: { _ts: Date.now() } }
        );
        const data = Array.isArray(resp) ? resp : resp?.data;
        return Array.isArray(data) ? (data as OndcCategoryTreeRow[]) : [];
    } catch (err) {
        console.error('getOndcCategoriesTree failed:', err);
        return false;
    }
};

export const createOndcCategoryApi = async (payload: CreateOndcCategoryPayload) => {
    try {
        const resp: any = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/categories`,
            {
                name: payload.name,
                ondcDomain: payload.ondcDomain,
                keywords: payload.keywords,
                displayOrder: payload.displayOrder,
                parentId: payload.parentId,
                iconUrl: payload.iconUrl,
                iconFormat: payload.iconFormat,
            }
        );
        return resp?.data ?? resp;
    } catch (err) {
        console.error('createOndcCategoryApi failed:', err);
        return false;
    }
};

export const updateOndcCategoryApi = async (payload: UpdateOndcCategoryPayload) => {
    try {
        const resp: any = await ApiClient.put(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/categories/${payload.id}`,
            {
                name: payload.name,
                ondcDomain: payload.ondcDomain,
                keywords: payload.keywords,
                displayOrder: payload.displayOrder,
                iconUrl: payload.iconUrl,
                iconFormat: payload.iconFormat,
            }
        );
        return resp?.data ?? resp;
    } catch (err) {
        console.error('updateOndcCategoryApi failed:', err);
        return false;
    }
};

/** Hard delete. Deleting a top-level category removes its subcategories too. */
export const deleteOndcCategoryApi = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: any = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/categories/${payload.id}`
        );
        return resp?.data ?? resp;
    } catch (err) {
        console.error('deleteOndcCategoryApi failed:', err);
        return false;
    }
};

export const setOndcCategoryEnabledApi = async (
    payload: UserPayload & { id: number; enabled: boolean }
) => {
    try {
        const resp: any = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/categories/${payload.id}/enabled`,
            { enabled: payload.enabled }
        );
        return resp?.data ?? resp;
    } catch (err) {
        console.error('setOndcCategoryEnabledApi failed:', err);
        return false;
    }
};
