import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AdminIssueDetail,
    AdminIssuesListPayload,
    AdminIssuesListResponse,
    RespondToIssuePayload,
} from '../types/adminOndcIssue';

/**
 * Envelope-tolerant unwrap — see the identical note on `unwrapPage` in
 * ../api/order.ts. The interceptor returns the HTTP body; if it's enveloped,
 * the page object is `resp.data` ({ recordsTotal, data: [...] }); if the body
 * arrives bare, `resp` already IS that page object. A blind `const { data } =
 * resp` on a bare body would hand the table the row array (whose `.data` is
 * undefined) → permanently-empty list, no error.
 */
const unwrapIssuesPage = (resp: any): AdminIssuesListResponse => {
    if (resp?.data && Array.isArray(resp.data.data)) return resp.data; // enveloped
    if (Array.isArray(resp?.data)) return resp; // bare body
    return resp?.data ?? resp;
};

export const getAllIssues = async (payload: AdminIssuesListPayload) => {
    try {
        const resp: SuccessGenericResponse<AdminIssuesListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/issues`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    status: payload.status,
                    category: payload.category,
                    sortField: payload.sortField,
                    needsAttention: payload.needsAttention,
                    // Cache-buster — always reflect latest issue states, defeat stale 304s.
                    _ts: Date.now(),
                },
            }
        );
        return unwrapIssuesPage(resp);
    } catch (err) {
        console.error('getAllIssues failed:', err);
        return false;
    }
};

export const getOpenIssuesCountApi = async (payload: UserPayload) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/issues/open-count`,
            { params: { _ts: Date.now() } }
        );
        // Envelope-tolerant: enveloped → resp.data = { count }; bare → resp = { count }.
        const inner = resp?.data && typeof resp.data.count === 'number' ? resp.data : resp;
        return inner as { count: number };
    } catch (err) {
        console.error('getOpenIssuesCountApi failed:', err);
        return false;
    }
};

export const getFileBufferReportIssues = async (
    payload: UserPayload & { type: string } & Partial<AdminIssuesListPayload>
) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/issues/${payload.type}`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    searchText: payload.searchText,
                    status: payload.status,
                    category: payload.category,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getIssueByIdApi = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<AdminIssueDetail> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/issues/${payload.id}`,
            { params: { _ts: Date.now() } }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        console.error('getIssueByIdApi failed:', err);
        return false;
    }
};

export const respondToIssueApi = async ({
    userId,
    userType,
    id,
    ...payload
}: RespondToIssuePayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/purchase/ecommerce/issues/${id}/respond`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
