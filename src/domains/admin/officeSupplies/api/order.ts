import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AdminOndcOrderDetail,
    OrderUpdatePayload,
    RefundOndcOrderPayload,
    UpdateOrderRequestPayload,
    allOrdersPayload,
    allOrdersResponse,
    getData,
    payloadVendors,
    transactionResponse,
    vendorListResponse,
} from '../types/types';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<transactionResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/orders`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    status: payload.status,
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

export const getFileBufferReportOrders = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/orders/${payload.type}`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    searchText: payload.searchText,
                    status: payload.status,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getCancelledOrders = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<transactionResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/cancelAndRefund/orders`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    status: payload.status,
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

export const getFileBufferReportCancelledOrders = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/cancelAndRefund/orders/${payload.type}`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    searchText: payload.searchText,
                    status: payload.status,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getVendorList = async ({
    userId,
    userType,
    ...payload
}: UserPayload & payloadVendors) => {
    try {
        const resp: SuccessGenericResponse<vendorListResponse[]> = await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/orders/vendors`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateOrderApi = async ({
    userId,
    userType,
    id,
    ...payload
}: UserPayload & OrderUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<vendorListResponse[]> = await ApiClient.put(
            `${userType}/${userId}/purchase/ecommerce/orders?corporateTxnId=${id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getOtpEcommerce = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/cancelAndRefund/get-otp?scope=email`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateOrderDetails = async ({
    userId,
    userType,
    corporateTxnId,
    ondcOrderId,
    ...payload
}: UpdateOrderRequestPayload) => {
    try {
        const query = ondcOrderId
            ? `ondcOrderId=${ondcOrderId}`
            : `corporateTxnId=${corporateTxnId}`;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/purchase/ecommerce/cancelAndRefund/?${query}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getReturnedOrders = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<transactionResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/returnAndRefund/orders`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    status: payload.status,
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

export const getFileBufferReportReturnedOrders = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/returnAndRefund/orders/${payload.type}`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    searchText: payload.searchText,
                    status: payload.status,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateReturnOrderDetails = async ({
    userId,
    userType,
    corporateTxnId,
    ondcOrderId,
    ...payload
}: UpdateOrderRequestPayload) => {
    try {
        const query = ondcOrderId
            ? `ondcOrderId=${ondcOrderId}`
            : `corporateTxnId=${corporateTxnId}`;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/purchase/ecommerce/returnAndRefund/?${query}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

/**
 * The response interceptor (services/config.ts) already returns the HTTP body.
 * Expected body: { status, message, responseCode, data: { recordsTotal,
 * recordsFiltered, data: [...] } } — so `resp.data` is the page object. But if
 * the body arrives WITHOUT the outer envelope (i.e. `resp` is already the bare
 * { recordsTotal, recordsFiltered, data: [...] }), `resp.data` would be the row
 * array itself and the usual `const { data } = resp` unwrap would silently hand
 * the table an array whose `.data` is undefined → permanently-empty table, no
 * error. This normalizes both shapes to the page object.
 */


/** "All orders" tab — real ONDC order rows, every state. */
export const getAllOndcOrders = async (payload: allOrdersPayload) => {
    try {
        const resp: SuccessGenericResponse<allOrdersResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/orders`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    status: payload.status,
                    sellerName: payload.sellerName,
                    sortField: payload.sortField,
                    needsAttention: payload.needsAttention,
                    delayedOnly: payload.delayedOnly,
                    returnsOnly: payload.returnsOnly,
                    // Cache-buster: this list must always reflect the latest order
                    // states. A unique URL per call defeats a stale browser/proxy
                    // 304 that was serving an empty body from before rows existed.
                    _ts: Date.now(),
                },
            }
        );
        return resp.data
    } catch (err) {
        console.error('getAllOndcOrders failed:', err);
        return false;
    }
};

/** Single ONDC order (admin, unscoped) for the order-detail page. */
export const getOndcOrderByIdAdminApi = async (payload: UserPayload & { id: string | number }) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/orders/${payload.id}`,
            { params: { _ts: Date.now() } }
        );
        // Envelope-tolerant: enveloped → resp.data is the order object (has .id);
        // bare → resp already IS the order object.
        const order = resp?.data && resp.data.id ? resp.data : resp;
        return order && order.id ? (order as AdminOndcOrderDetail) : false;
    } catch (err) {
        console.error('getOndcOrderByIdAdminApi failed:', err);
        return false;
    }
};

/**
 * Refund a delayed ONDC order to the buyer.
 *
 * Unlike updateOrderDetails / updateReturnOrderDetails (which only notify the seller),
 * this moves money. Rethrows so the caller can surface the server's specific reason —
 * "not delayed yet", "already fully refunded" — instead of a generic failure.
 * No OTP: unlike the cancel and return actions, this one has no second factor.
 */
export const refundOndcOrderApi = async ({ userId, userType, id, ...payload }: RefundOndcOrderPayload) => {
    const resp: SuccessGenericResponse<{}> = await ApiClient.put(
        `${userType}/${userId}/purchase/ecommerce/ondc/orders/${id}/refund`,
        payload
    );
    return resp?.data ?? true;
};

/** Distinct seller names across all ONDC orders — the "Seller" filter dropdown. */
export const getOndcOrderSellers = async (payload: UserPayload) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/orders/vendors`,
            { params: { _ts: Date.now() } }
        );
        // Same envelope-tolerance as unwrapPage, but the payload here is a bare
        // string[] rather than a { recordsTotal, data } page object.
        const list: string[] = Array.isArray(resp) ? resp : resp?.data;
        return Array.isArray(list) ? list : [];
    } catch (err) {
        console.error('getOndcOrderSellers failed:', err);
        return false;
    }
};

/** Excel/CSV/PDF export for the "All orders" (ONDC) tab. */
export const getFileBufferReportOndcOrders = async (
    payload: UserPayload & Partial<allOrdersPayload> & { type: string }
) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/orders/${payload.type}`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    searchText: payload.searchText,
                    status: payload.status,
                    sellerName: payload.sellerName,
                    sortField: payload.sortField,
                    needsAttention: payload.needsAttention,
                    delayedOnly: payload.delayedOnly,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        console.error('getFileBufferReportOndcOrders failed:', err);
        return false;
    }
};
