import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OndcIssue } from '../types/ondcIssue';
import {
    OndcOrderDetail,
    OndcOrderDetailRequestPayload,
    OndcOrderHistoryRequestPayload,
    OndcOrderHistoryResponse,
    OndcOrderRefreshResult,
} from '../types/ondcOrderHistory';
import { IssuePhoto } from '../utils/issuePhoto';

/** ONDC order history list (confirmed orders), paginated/filterable. */
export const getOndcOrderHistoryApi = async (payload: OndcOrderHistoryRequestPayload) => {
    try {
        const { userId, userType, from, to, search, page, itemsPerPage } = payload;
        const params = { from, to, search, page, itemsPerPage };
        const resp: SuccessGenericResponse<OndcOrderHistoryResponse> = await ApiClient.get(
            `${userType}/${userId}/purchase/ecommerce/ondc/orders`,
            { params }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

/** Single confirmed order detail (Order Details page). */
export const getOndcOrderByIdApi = async (payload: OndcOrderDetailRequestPayload) => {
    try {
        const { userId, userType, id } = payload;
        const resp: SuccessGenericResponse<OndcOrderDetail> = await ApiClient.get(
            `${userType}/${userId}/purchase/ecommerce/ondc/orders/${id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

/** Explicit ONDC /status call (Order Details "Refresh status" button). */
export const refreshOndcOrderStatusApi = async (
    payload: OndcOrderDetailRequestPayload
): Promise<false | OndcOrderRefreshResult> => {
    try {
        const { userId, userType, id } = payload;
        const resp: SuccessGenericResponse<OndcOrderRefreshResult> = await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/ondc/orders/${id}/status`,
            {}
        );
        return resp.data || false;
    } catch (err) {
        return false;
    }
};

/** Explicit ONDC /track call (Order Details "Track shipment" button). */
export const refreshOndcOrderTrackingApi = async (
    payload: OndcOrderDetailRequestPayload
): Promise<false | OndcOrderRefreshResult> => {
    try {
        const { userId, userType, id } = payload;
        const resp: SuccessGenericResponse<OndcOrderRefreshResult> = await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/ondc/orders/${id}/track`,
            {}
        );
        return resp.data || false;
    } catch (err) {
        return false;
    }
};

/** Cancel a confirmed ONDC order — a real, direct /cancel call to the seller
 *  (Order Details page's "Cancel order" flow), not a request queued for later. */
export const cancelOndcOrderApi = async (
    payload: OndcOrderDetailRequestPayload & { reason: string; description: string }
): Promise<
    | false
    | {
          cancelled: boolean;
          refund?: {
              status: boolean;
              amount?: number;
              message?: string | null;
              alreadyRefunded?: boolean;
          } | null;
      }
> => {
    try {
        const { userId, userType, id, reason, description } = payload;
        const resp: SuccessGenericResponse<{
            cancelled: boolean;
            refund?: { status: boolean; amount?: number; message?: string | null } | null;
        }> = await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/ondc/orders/${id}/cancel`,
            { reason, description }
        );
        return resp.data || { cancelled: true };
    } catch (err) {
        return false;
    }
};

/** DigiDukaan return for a delivered ONDC order — /update return_request. */
export const returnOndcOrderApi = async (
    payload: OndcOrderDetailRequestPayload & {
        items: { itemId: string; quantity: number }[];
        reasonId: string;
        reasonDesc: string;
        images?: IssuePhoto[];
        replace?: boolean;
    }
): Promise<
    | false
    | {
          returned?: boolean;
          returnStatus?: string;
          returnRequestId?: string;
          replace?: boolean;
          refund?: {
              status: boolean;
              amount?: number;
              message?: string | null;
              alreadyRefunded?: boolean;
          } | null;
      }
> => {
    try {
        const { userId, userType, id, items, reasonId, reasonDesc, images, replace } = payload;
        const resp: SuccessGenericResponse<{
            returned?: boolean;
            returnStatus?: string;
            returnRequestId?: string;
            replace?: boolean;
            refund?: { status: boolean; amount?: number; message?: string | null } | null;
        }> = await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/ondc/orders/${id}/return`,
            { items, reasonId, reasonDesc, images, replace: Boolean(replace) }
        );
        return resp.data || { returnStatus: 'Return_Initiated' };
    } catch (err) {
        return false;
    }
};

/** Get issues raised on a confirmed order (newest first, each with its full thread). */
export const getOndcOrderIssuesApi = async (payload: OndcOrderDetailRequestPayload) => {
    try {
        const { userId, userType, id } = payload;
        const resp: SuccessGenericResponse<{ rows: OndcIssue[] }> = await ApiClient.get(
            `${userType}/${userId}/purchase/ecommerce/ondc/orders/${id}/issues`
        );
        return resp.data.rows;
    } catch (err) {
        return [];
    }
};

/** Raise a new issue on a confirmed order */
export const raiseOndcIssueApi = async (
    payload: OndcOrderDetailRequestPayload & {
        category: string;
        subCategory: string;
        description: string;
        images?: IssuePhoto[];
        clientRequestId: string;
    }
) => {
    try {
        const { userId, userType, id, category, subCategory, description, images, clientRequestId } = payload;
        const resp = await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/ondc/orders/${id}/issues`,
            { category, subCategory, description, images, clientRequestId }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

/** Reply or close an existing issue */
export const respondToOndcIssueApi = async (
    payload: OndcOrderDetailRequestPayload & {
        issueId: number;
        message: string;
        cannotProvideProof?: boolean;
        images?: IssuePhoto[];
        clientRequestId: string;
    }
) => {
    try {
        const { userId, userType, id, issueId, message, cannotProvideProof, images, clientRequestId } = payload;
        await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/ondc/orders/${id}/issues/${issueId}/respond`,
            { message, cannotProvideProof, images, clientRequestId }
        );
        return true;
    } catch (err) {
        return false;
    }
};

const postOndcIssueAction = async (
    payload: OndcOrderDetailRequestPayload & { issueId: number; resolutionId?: string | null },
    action: 'reject' | 'escalate' | 'accept' | 'close'
): Promise<boolean> => {
    try {
        const { userId, userType, id, issueId, resolutionId } = payload;
        await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/ondc/orders/${id}/issues/${issueId}/${action}`,
            resolutionId ? { resolutionId } : {}
        );
        return true;
    } catch (err) {
        return false;
    }
};

export const rejectOndcIssueApi = (payload: OndcOrderDetailRequestPayload & { issueId: number }) =>
    postOndcIssueAction(payload, 'reject');
export const escalateOndcIssueApi = (payload: OndcOrderDetailRequestPayload & { issueId: number }) =>
    postOndcIssueAction(payload, 'escalate');
export const acceptOndcIssueApi = (
    payload: OndcOrderDetailRequestPayload & { issueId: number; resolutionId?: string | null }
) => postOndcIssueAction(payload, 'accept');
export const closeOndcIssueApi = (payload: OndcOrderDetailRequestPayload & { issueId: number }) =>
    postOndcIssueAction(payload, 'close');
