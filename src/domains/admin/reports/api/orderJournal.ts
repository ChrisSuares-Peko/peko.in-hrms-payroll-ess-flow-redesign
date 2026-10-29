import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ExportFormat } from '@src/domains/admin/accounting/types/export';
import { ApiClient } from '@src/services/config';

import { getData } from '../types/index';
import {
    JournalKey,
    JournalRetryResult,
    OrderDocumentDownloadResponse,
    OrderDocumentRecipient,
    OrderDocumentType,
    orderJournalResponse,
    RetryAllFailedResult,
    RetryJournalPayload,
} from '../types/orderJournal';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<orderJournalResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/order-journals`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    to: payload.to,
                    from: payload.from,
                    sortField: payload.sortField,
                    journalStatus: payload.status,
                    journalKey: payload.journalKey,
                    partnerId: payload.partnerId || undefined,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export type OrderJournalsExportQuery = Omit<getData, 'page' | 'itemsPerPage'> & {
    format: ExportFormat;
};

export const downloadOrderJournals = async (payload: UserPayload & OrderJournalsExportQuery) => {
    try {
        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/order-journals/export/${payload.format}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    to: payload.to,
                    from: payload.from,
                    sortField: payload.sortField,
                    journalStatus: payload.status,
                    journalKey: payload.journalKey,
                    partnerId: payload.partnerId || undefined,
                },
                responseType: 'blob',
            }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};

// Resolve provider (Zoho) account IDs -> current COA account names. corporateTxnId lets
// generic accounts (Subscribers Wallet/Vendor Deposits/Partnership Fee Payable) display
// with the order's entity name appended.
export const resolveAccountNames = async (
    payload: UserPayload,
    accountIds: string[],
    corporateTxnId?: string
) => {
    try {
        const resp: SuccessGenericResponse<Record<string, string>> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/order-journals/resolve-accounts`,
            { accountIds, corporateTxnId }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

const refusedRetry = (error: unknown): JournalRetryResult | false => {
    const body = (
        error as { response?: { data?: { message?: string; reason?: string; error?: string } } }
    )?.response?.data;
    if (!body) return false;
    return { success: false, reason: body.message || body.reason || body.error };
};

export const retryJournal = async (
    payload: UserPayload & { corporateTxnId: string; journalKey: JournalKey } & RetryJournalPayload
) => {
    try {
        const { userId, userType, corporateTxnId, journalKey, ...body } = payload;
        const resp: SuccessGenericResponse<JournalRetryResult> = await ApiClient.put(
            `${userType}/${userId}/others/order-journals/${corporateTxnId}/journal/${journalKey}/retry`,
            body
        );
        return resp.data;
    } catch (error) {
        return refusedRetry(error);
    }
};

export const retryAllFailedJournals = async (payload: UserPayload & { corporateTxnId: string }) => {
    try {
        const { userId, userType, corporateTxnId } = payload;
        const resp: SuccessGenericResponse<RetryAllFailedResult> = await ApiClient.put(
            `${userType}/${userId}/others/order-journals/${corporateTxnId}/journal/retry-all-failed`,
            {}
        );
        return resp.data;
    } catch (error) {
        return (error as any)?.response?.data ?? false;
    }
};

export const downloadOrderDocument = async (
    payload: UserPayload & {
        orderId: number;
        recipient: OrderDocumentRecipient;
        docType: OrderDocumentType;
    }
) => {
    try {
        const { userId, userType, orderId, recipient, docType } = payload;
        const resp: SuccessGenericResponse<OrderDocumentDownloadResponse> = await ApiClient.get(
            `${userType}/${userId}/others/order-journals/${orderId}/documents/${recipient}/${docType}`
        );
        return resp.data;
    } catch (error) {
        return false;
    }
};
