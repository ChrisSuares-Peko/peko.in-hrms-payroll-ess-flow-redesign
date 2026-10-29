import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    LedgerChangeReason,
    deleteLedgerEntry,
    markLedgerBooks,
    putLedgerEntry,
} from './ledgerChanges';
import { ExportFormat } from '../types/export';
import {
    PartnerDebitNoteEntry,
    PartnerDebitNotePayload,
    PartnerLedgerDetailResponse,
    PartnerLedgerListResponse,
    PartnerLedgerTabFilters,
    PartnerLedgerTabResponse,
    PartnerOpeningBalancePayload,
    PartnerPayoutEntry,
    PartnerPayoutPayload,
    PartnerPayoutSuggestion,
    PartnerPayoutsResponse,
    PartnerStatementResponse,
    PartnerSubscriptionEntry,
    PartnerTransactionEntry,
} from '../types/partnerLedger';

const base = ({ userType, userId }: UserPayload) =>
    `${userType}/${userId}/others/accounting/partners`;

const partnerPath = (payload: UserPayload & { partnerId: string }) =>
    `${base({ userId: payload.userId, userType: payload.userType })}/${encodeURIComponent(payload.partnerId)}`;

export const getPartnerLedgerList = async (
    payload: UserPayload & {
        page: number;
        itemsPerPage: number;
        searchText: string;
        refresh?: boolean;
    }
) => {
    try {
        const { userId, userType, refresh, ...filters } = payload;
        const resp: SuccessGenericResponse<PartnerLedgerListResponse> = await ApiClient.get(
            base({ userId, userType }),
            { params: { ...filters, ...(refresh ? { refresh: 1 } : {}) } }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getPartnerLedgerDetail = async (
    payload: UserPayload & { partnerId: string; from?: string; to?: string }
) => {
    try {
        const { from, to } = payload;
        const resp: SuccessGenericResponse<PartnerLedgerDetailResponse> = await ApiClient.get(
            partnerPath(payload),
            { params: from && to ? { from, to } : {}, skipErrorToast: true }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

const getTab = async <T>(
    payload: UserPayload & { partnerId: string; tab: string } & PartnerLedgerTabFilters
) => {
    try {
        const { userId, userType, partnerId, tab, ...filters } = payload;
        const resp: SuccessGenericResponse<PartnerLedgerTabResponse<T>> = await ApiClient.get(
            `${partnerPath({ userId, userType, partnerId })}/${tab}`,
            { params: filters }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadPartnerLedgerTab = async (
    payload: UserPayload & {
        partnerId: string;
        tab: string;
        format: ExportFormat;
    } & Pick<PartnerLedgerTabFilters, 'from' | 'to' | 'searchText' | 'status' | 'mode'>
) => {
    try {
        const { userId, userType, partnerId, tab, format, ...filters } = payload;
        const resp = await ApiClient.get(
            `${partnerPath({ userId, userType, partnerId })}/${tab}/export/${format}`,
            { params: filters, responseType: 'blob' }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};

export const getPartnerTransactions = (
    payload: UserPayload & { partnerId: string } & PartnerLedgerTabFilters
) => getTab<PartnerTransactionEntry>({ ...payload, tab: 'transactions' });

export const getPartnerSubscriptions = (
    payload: UserPayload & { partnerId: string } & PartnerLedgerTabFilters
) => getTab<PartnerSubscriptionEntry>({ ...payload, tab: 'own-subscriptions' });

export const getPartnerPayouts = async (
    payload: UserPayload & { partnerId: string } & PartnerLedgerTabFilters
) => {
    try {
        const { userId, userType, partnerId, ...filters } = payload;
        const resp: SuccessGenericResponse<PartnerPayoutsResponse> = await ApiClient.get(
            `${partnerPath({ userId, userType, partnerId })}/payments`,
            { params: filters }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getPartnerPayoutSuggestion = async (payload: UserPayload & { partnerId: string }) => {
    try {
        const resp: SuccessGenericResponse<PartnerPayoutSuggestion> = await ApiClient.get(
            `${partnerPath(payload)}/payments/suggestion`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const createPartnerPayout = async (
    payload: UserPayload & { partnerId: string } & PartnerPayoutPayload
) => {
    try {
        const { userId, userType, partnerId, ...body } = payload;
        const resp: SuccessGenericResponse<PartnerPayoutEntry> = await ApiClient.post(
            `${partnerPath({ userId, userType, partnerId })}/payments`,
            body
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const createPartnerOpeningBalance = async (
    payload: UserPayload & { partnerId: string } & PartnerOpeningBalancePayload
) => {
    try {
        const { userId, userType, partnerId, ...body } = payload;
        const resp: SuccessGenericResponse<PartnerPayoutEntry> = await ApiClient.post(
            `${partnerPath({ userId, userType, partnerId })}/opening-balance`,
            body
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const reversePartnerPayout = async (
    payload: UserPayload & { partnerId: string; id: number; reason: string }
) => {
    try {
        const { userId, userType, partnerId, id, reason } = payload;
        const resp: SuccessGenericResponse<PartnerPayoutEntry> = await ApiClient.patch(
            `${partnerPath({ userId, userType, partnerId })}/payments/${id}/reverse`,
            { reason }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getPartnerDebitNotes = (
    payload: UserPayload & { partnerId: string } & PartnerLedgerTabFilters
) => getTab<PartnerDebitNoteEntry>({ ...payload, tab: 'debit-notes' });

export const createPartnerDebitNote = async (
    payload: UserPayload & { partnerId: string } & PartnerDebitNotePayload
) => {
    try {
        const { userId, userType, partnerId, ...body } = payload;
        const resp: SuccessGenericResponse<PartnerDebitNoteEntry> = await ApiClient.post(
            `${partnerPath({ userId, userType, partnerId })}/debit-notes`,
            body
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const reversePartnerDebitNote = async (
    payload: UserPayload & { partnerId: string; id: number; reason: string }
) => {
    try {
        const { userId, userType, partnerId, id, reason } = payload;
        const resp: SuccessGenericResponse<PartnerDebitNoteEntry> = await ApiClient.patch(
            `${partnerPath({ userId, userType, partnerId })}/debit-notes/${id}/reverse`,
            { reason }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getPartnerStatement = async (
    payload: UserPayload & { partnerId: string } & PartnerLedgerTabFilters
) => {
    try {
        const { userId, userType, partnerId, ...filters } = payload;
        const resp: SuccessGenericResponse<PartnerStatementResponse> = await ApiClient.get(
            `${partnerPath({ userId, userType, partnerId })}/statement`,
            { params: filters }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadPartnerStatement = async (
    payload: UserPayload & { partnerId: string; format: 'export' | 'pdf' } & PartnerLedgerTabFilters
) => {
    try {
        const { userId, userType, partnerId, format, ...filters } = payload;
        const resp = await ApiClient.get(
            `${partnerPath({ userId, userType, partnerId })}/statement/${format}`,
            { params: filters, responseType: 'blob' }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};

type PartnerEntryTarget = UserPayload & { partnerId: string; id: number };

const partnerEntryUrl = ({ userId, userType, partnerId, id }: PartnerEntryTarget, path: string) =>
    `${partnerPath({ userId, userType, partnerId })}/${path}/${id}`;

export const updatePartnerPayout = ({
    userId,
    userType,
    partnerId,
    id,
    ...body
}: PartnerEntryTarget & PartnerPayoutPayload & LedgerChangeReason) =>
    putLedgerEntry<PartnerPayoutEntry>(
        partnerEntryUrl({ userId, userType, partnerId, id }, 'payments'),
        body
    );

export const deletePartnerPayout = ({
    reason,
    ...target
}: PartnerEntryTarget & { reason: string }) =>
    deleteLedgerEntry<PartnerPayoutEntry>(partnerEntryUrl(target, 'payments'), reason);

export const updatePartnerOpeningBalance = ({
    userId,
    userType,
    partnerId,
    id,
    ...body
}: PartnerEntryTarget & PartnerOpeningBalancePayload & LedgerChangeReason) =>
    putLedgerEntry<PartnerPayoutEntry>(
        partnerEntryUrl({ userId, userType, partnerId, id }, 'opening-balance'),
        body
    );

export const deletePartnerOpeningBalance = ({
    reason,
    ...target
}: PartnerEntryTarget & { reason: string }) =>
    deleteLedgerEntry<PartnerPayoutEntry>(partnerEntryUrl(target, 'opening-balance'), reason);

export const updatePartnerDebitNote = ({
    userId,
    userType,
    partnerId,
    id,
    ...body
}: PartnerEntryTarget & PartnerDebitNotePayload & LedgerChangeReason) =>
    putLedgerEntry<PartnerDebitNoteEntry>(
        partnerEntryUrl({ userId, userType, partnerId, id }, 'debit-notes'),
        body
    );

export const deletePartnerDebitNote = ({
    reason,
    ...target
}: PartnerEntryTarget & { reason: string }) =>
    deleteLedgerEntry<PartnerDebitNoteEntry>(partnerEntryUrl(target, 'debit-notes'), reason);

export const markPartnerPayoutBooks = ({
    synced,
    ...target
}: PartnerEntryTarget & { synced: boolean }) =>
    markLedgerBooks<PartnerPayoutEntry>(`${partnerEntryUrl(target, 'payments')}/books`, synced);

export const markPartnerDebitNoteBooks = ({
    synced,
    ...target
}: PartnerEntryTarget & { synced: boolean }) =>
    markLedgerBooks<PartnerDebitNoteEntry>(
        `${partnerEntryUrl(target, 'debit-notes')}/books`,
        synced
    );
