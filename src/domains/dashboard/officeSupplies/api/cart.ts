import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AddToCartRequestPayload,
    AddToCartRequestResponse,
    CartDetailsPayload,
    CartDetailsResponse,
    CheckoutResultResponse,
    ClearUnavailableRequestPayload,
    ClearUnavailableResponse,
    ConfirmOrderRequestPayload,
    ConfirmOrderResponse,
    DeleteFromCartRequestPayload,
    DeleteFromCartResponse,
    InitOrderRequestPayload,
    InitOrderResponse,
    updateCartRequestPayload,
    updateFromCartResponse,
    ValidateCartRequestPayload,
    ValidateCartResponse,
} from '../types/cartTypes';

export const getCartDetailsApi = async (payload: CartDetailsPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<CartDetailsResponse> = await ApiClient.get(
            `${userType}/${userId}/purchase/ecommerce/ondc/cartDetails`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const addToCartApi = async (payload: AddToCartRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<AddToCartRequestResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/addOndcToCart`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

/**
 * Pre-checkout seller validation: the backend groups the cart by seller, fires
 * an ONDC /select per group and holds until each on_select quote arrives, so
 * this call can take up to ~30s. Returns the per-seller quote breakups.
 */
export const validateCartApi = async (payload: ValidateCartRequestPayload) => {
    try {
        const { userId, userType, pincode, gps, ondcProductIds } = payload;
        const resp: SuccessGenericResponse<ValidateCartResponse> = await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/ondc/validateCart`,
            { pincode, gps, ondcProductIds }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

/**
 * ONDC /init at Pay time: the backend fires a signed init per seller group with
 * the billing + delivery details and holds until each on_init returns the
 * final quote + payment terms — can take up to ~30s.
 */
export const initOrderApi = async (payload: InitOrderRequestPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<InitOrderResponse> = await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/ondc/initOrder`,
            body
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

/**
 * ONDC /confirm after a successful init: the backend echoes each parked
 * on_init order back to its seller marked PAID and holds until on_confirm
 * returns the created order — can take up to ~30s.
 */
/**
 * The outcome of one paid checkout, derived from the ONDC `on_confirm` orders.
 *
 * The post-payment page reads this instead of driving the confirm: since the
 * chain (Easy Split → ONDC confirm) is orchestrated server-side from
 * /cashfree-gateway/complete, the browser's only job is to show the result.
 * `status` is PENDING while /complete is still working.
 */
export const getCheckoutResultApi = async (
    payload: UserPayload & { paymentRef: string }
) => {
    try {
        const resp: SuccessGenericResponse<CheckoutResultResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/checkout-result`,
            { params: { paymentRef: payload.paymentRef } }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const confirmOrderApi = async (payload: ConfirmOrderRequestPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<ConfirmOrderResponse> = await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/ondc/confirmOrder`,
            body
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateCartApi = async (payload: updateCartRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<updateFromCartResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/cart`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteFromCartApi = async (payload: DeleteFromCartRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<DeleteFromCartResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/cart?productId=${payload.productId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

/** Remove ALL "No longer available" items in one call (works even for legacy
 *  cart snapshots that have no productId and can't be deleted per-item). */
export const clearUnavailableFromCartApi = async (payload: ClearUnavailableRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<ClearUnavailableResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/cart?clearUnavailable=true`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
