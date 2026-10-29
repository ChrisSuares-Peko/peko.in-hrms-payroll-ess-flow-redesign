import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AdminOndcProductDetail,
    OndcProductFilters,
    OndcProductsPayload,
    OndcProductsResponse,
} from '../types/ondcProduct';

/** Envelope-tolerant page unwrap — mirrors api/order.ts's unwrapPage. */
const unwrapPage = (resp: any): OndcProductsResponse => {
    if (resp?.data && Array.isArray(resp.data.data)) return resp.data; // enveloped
    if (Array.isArray(resp?.data)) return resp; // bare body
    return resp?.data ?? resp;
};

const listParams = (payload: OndcProductsPayload) => ({
    page: payload.page,
    itemsPerPage: payload.itemsPerPage,
    searchText: payload.searchText,
    category: payload.category,
    sellerName: payload.sellerName,
    bppId: payload.bppId,
    domain: payload.domain,
    availability: payload.availability,
    city: payload.city,
    visibility: payload.visibility,
    sort: payload.sort,
    sortField: payload.sortField,
});

export const getOndcProducts = async (payload: OndcProductsPayload) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/products`,
            { params: { ...listParams(payload), _ts: Date.now() } }
        );
        return unwrapPage(resp);
    } catch (err) {
        console.error('getOndcProducts failed:', err);
        return false;
    }
};

export const getOndcProductFilters = async (payload: UserPayload) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/products/filters`,
            { params: { _ts: Date.now() } }
        );
        const data = resp?.data && !Array.isArray(resp.data) ? resp.data : resp;
        // Older backends don't send sellerNps.
        return { ...data, sellerNps: data?.sellerNps ?? [] } as OndcProductFilters;
    } catch (err) {
        console.error('getOndcProductFilters failed:', err);
        return false;
    }
};

export const getOndcProductByIdApi = async (payload: UserPayload & { id: string | number }) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/products/${payload.id}`,
            { params: { _ts: Date.now() } }
        );
        const p = resp?.data && resp.data.id ? resp.data : resp;
        return p && p.id ? (p as AdminOndcProductDetail) : false;
    } catch (err) {
        console.error('getOndcProductByIdApi failed:', err);
        return false;
    }
};

export const setOndcProductVisibilityApi = async (
    payload: UserPayload & { id: number; visible: boolean }
) => {
    try {
        const resp: any = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/products/${payload.id}/visibility`,
            { visible: payload.visible }
        );
        return resp?.data ?? resp;
    } catch (err) {
        console.error('setOndcProductVisibilityApi failed:', err);
        return false;
    }
};

export const getOndcProductsReport = async (payload: OndcProductsPayload & { type: string }) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/products/${payload.type}`,
            { params: listParams(payload) }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        console.error('getOndcProductsReport failed:', err);
        return false;
    }
};
