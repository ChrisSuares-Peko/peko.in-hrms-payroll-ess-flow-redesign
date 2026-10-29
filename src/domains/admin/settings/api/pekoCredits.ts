import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    BulkUpdateStatusResponse,
    bulkUpdateStatus,
    Coupon,
    CouponData,
    DeleteCouponPayload,
    getCoupon,
    newCouponCode,
    updateStatus,
} from '../types/pekoCredits';

export const getAllCouponCodeData = async (payload: UserPayload & getCoupon) => {
    try {
        const resp: SuccessGenericResponse<CouponData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/peko-credits`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
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

export const addCouponCode = async ({
    userType,
    userId,
    ...payload
}: UserPayload & newCouponCode) => {
    try {
        const resp: SuccessGenericResponse<Coupon> = await ApiClient.post(
            `${userType}/${userId}/purchase/peko-credits`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateCouponCodeStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateStatus) => {
    try {
        const { couponId } = payload;
        delete payload.couponId;
        const resp: SuccessGenericResponse<Coupon> = await ApiClient.patch(
            `${userType}/${userId}/purchase/peko-credits/${couponId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

/**
 * Staging-only switch that flips every peko credit at once. The backend rejects
 * this with a 403 outside staging, so the caller must gate the UI on ENV too.
 */
export const bulkUpdatePekoCreditsStatus = async ({
    userId,
    userType,
    status,
}: UserPayload & bulkUpdateStatus) => {
    try {
        const resp: SuccessGenericResponse<BulkUpdateStatusResponse> = await ApiClient.patch(
            `${userType}/${userId}/purchase/peko-credits/bulk-status`,
            { status }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deletePekoCreditsApi = async ({
    userId,
    userType,
    couponId,
}: UserPayload & DeleteCouponPayload) => {
    try {
        const resp: SuccessGenericResponse<Coupon> = await ApiClient.delete(
            `${userType}/${userId}/purchase/peko-credits/${couponId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateCouponCode = async ({
    userId,
    userType,
    ...payload
}: UserPayload & newCouponCode) => {
    try {
        const { id, couponType } = payload;

        delete payload.id;
        if (couponType === 'SERVICES') {
            delete payload.packageId;
        } else if (couponType === 'SUBSCRIPTION') {
            delete payload.serviceOperatorId;
        }

        const resp: SuccessGenericResponse<Coupon> = await ApiClient.put(
            `${userType}/${userId}/purchase/peko-credits/${id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getFileBufferPekoCredit = async (payload: UserPayload & getCoupon) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/peko-credits/download/${payload.type}`,
            {
                params: {
                    partnerId: payload.partnerId,
                    searchText: payload.searchText,
                    type: payload.type,
                    // to: payload.to,
                    // from: payload.from,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
