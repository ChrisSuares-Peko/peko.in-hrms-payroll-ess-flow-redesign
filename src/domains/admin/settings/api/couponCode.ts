import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { Coupon, CouponData, getCoupon, newCouponCode, updateStatus } from '../types/couponCode';

export const getAllCouponCodeData = async (payload: UserPayload & getCoupon) => {
    try {
      
        const resp: SuccessGenericResponse<CouponData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/coupons`,
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

export const addCouponCode = async (payload: UserPayload & newCouponCode) => {
    try {
        const { userId, userType, ...couponPayload } = payload;
        const resp: SuccessGenericResponse<Coupon> = await ApiClient.post(
            `${userType}/${userId}/purchase/coupons`,
            couponPayload
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
            `${userType}/${userId}/purchase/coupons/${couponId}`,
            payload
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
        const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<Coupon> = await ApiClient.put(
            `${userType}/${userId}/purchase/coupons/${id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferCouponCode = async (payload: UserPayload & getCoupon) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/coupons/download/${payload.type}`,
            {
                params: {
                    ...payload,
                    type: payload.type,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
