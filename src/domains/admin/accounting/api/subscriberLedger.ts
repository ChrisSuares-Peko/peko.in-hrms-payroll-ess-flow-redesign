import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { ExportFormat } from '../types/export';
import {
    SubscriberBillEntry,
    SubscriberLedgerDetailResponse,
    SubscriberLedgerListResponse,
    SubscriberLedgerTabFilters,
    SubscriberLedgerTabResponse,
    SubscriberOrderDocument,
    SubscriberTransactionEntry,
    SubscriberWalletEntry,
} from '../types/subscriberLedger';

const base = ({ userType, userId }: UserPayload) =>
    `${userType}/${userId}/others/accounting/subscribers`;

export const getSubscriberLedgerList = async (
    payload: UserPayload & {
        page: number;
        itemsPerPage: number;
        searchText: string;
        partnerId?: string;
        refresh?: boolean;
    }
) => {
    try {
        const { userId, userType, refresh, ...filters } = payload;
        const resp: SuccessGenericResponse<SubscriberLedgerListResponse> = await ApiClient.get(
            base({ userId, userType }),
            { params: { ...filters, ...(refresh ? { refresh: 1 } : {}) } }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getSubscriberLedgerDetail = async (
    payload: UserPayload & { credentialId: string; from?: string; to?: string }
) => {
    try {
        const { userId, userType, credentialId, from, to } = payload;
        const resp: SuccessGenericResponse<SubscriberLedgerDetailResponse> = await ApiClient.get(
            `${base({ userId, userType })}/${encodeURIComponent(credentialId)}`,
            { params: from && to ? { from, to } : {}, skipErrorToast: true }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadSubscriberLedgerTab = async (
    payload: UserPayload & {
        credentialId: string;
        tab: string;
        format: ExportFormat;
    } & Pick<SubscriberLedgerTabFilters, 'from' | 'to' | 'searchText' | 'status' | 'type' | 'side'>
) => {
    try {
        const { userId, userType, credentialId, tab, format, ...filters } = payload;
        const resp = await ApiClient.get(
            `${base({ userId, userType })}/${encodeURIComponent(credentialId)}/${tab}/export/${format}`,
            { params: filters, responseType: 'blob' }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};

const ORDER_DOCUMENT_PATHS: Record<SubscriberOrderDocument, (orderId: number) => string> = {
    receipt: orderId => `transactions/${orderId}/receipt`,
    fullInvoice: orderId => `bills/${orderId}/invoice`,
    pekoInvoice: orderId => `bills/${orderId}/peko-invoice`,
};

export const downloadSubscriberOrderDocument = async (
    payload: UserPayload & {
        credentialId: string;
        orderId: number;
        document: SubscriberOrderDocument;
    }
) => {
    try {
        const { userId, userType, credentialId, orderId, document } = payload;
        const resp = await ApiClient.get(
            `${base({ userId, userType })}/${encodeURIComponent(credentialId)}/${ORDER_DOCUMENT_PATHS[document](orderId)}`,
            { responseType: 'blob' }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};

const getTab = async <T>(
    payload: UserPayload & { credentialId: string; tab: string } & SubscriberLedgerTabFilters
) => {
    try {
        const { userId, userType, credentialId, tab, ...filters } = payload;
        const resp: SuccessGenericResponse<SubscriberLedgerTabResponse<T>> = await ApiClient.get(
            `${base({ userId, userType })}/${encodeURIComponent(credentialId)}/${tab}`,
            { params: filters }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getSubscriberTransactions = (
    payload: UserPayload & { credentialId: string } & SubscriberLedgerTabFilters
) => getTab<SubscriberTransactionEntry>({ ...payload, tab: 'transactions' });

export const getSubscriberWallet = (
    payload: UserPayload & { credentialId: string } & SubscriberLedgerTabFilters
) => getTab<SubscriberWalletEntry>({ ...payload, tab: 'wallet' });

export const getSubscriberBills = (
    payload: UserPayload & { credentialId: string } & SubscriberLedgerTabFilters
) => getTab<SubscriberBillEntry>({ ...payload, tab: 'bills' });
