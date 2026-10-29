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
    VendorCommissionEntry,
    VendorCostOfSalesEntry,
    VendorCreditNoteEntry,
    VendorDebitNoteEntry,
    VendorDepositEntry,
    VendorDepositPayload,
    VendorEntryPayload,
    VendorLedgerDetailResponse,
    VendorLedgerListResponse,
    VendorLedgerTabFilters,
    VendorLedgerTabResponse,
    VendorOpeningBalancePayload,
    VendorStatementResponse,
    VendorTaxDocumentSource,
    VendorTaxDocumentTab,
    VendorTransactionEntry,
} from '../types/vendorLedger';

const base = ({ userType, userId }: UserPayload) =>
    `${userType}/${userId}/others/accounting/vendors`;

export const getVendorLedgerList = async (
    payload: UserPayload & {
        page: number;
        itemsPerPage: number;
        searchText: string;
        refresh?: boolean;
    }
) => {
    try {
        const { userId, userType, refresh, ...filters } = payload;
        const resp: SuccessGenericResponse<VendorLedgerListResponse> = await ApiClient.get(
            base({ userId, userType }),
            { params: { ...filters, ...(refresh ? { refresh: 1 } : {}) } }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getVendorLedgerDetail = async (
    payload: UserPayload & { vendorId: string; from?: string; to?: string }
) => {
    try {
        const { userId, userType, vendorId, from, to } = payload;
        const resp: SuccessGenericResponse<VendorLedgerDetailResponse> = await ApiClient.get(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}`,
            { params: from && to ? { from, to } : {}, skipErrorToast: true }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getVendorLedgerSlip = async (payload: UserPayload & { slipKey: string }) => {
    try {
        const { userId, userType, slipKey } = payload;
        const resp: SuccessGenericResponse<{ buffer: { data: number[] }; type: string }> =
            await ApiClient.get(`${userType}/${userId}/others/document/${slipKey}`);
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getVendorStatement = async (
    payload: UserPayload & { vendorId: string } & VendorLedgerTabFilters
) => {
    try {
        const { userId, userType, vendorId, ...filters } = payload;
        const resp: SuccessGenericResponse<VendorStatementResponse> = await ApiClient.get(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/statement`,
            { params: filters }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadVendorStatement = async (
    payload: UserPayload & { vendorId: string; format: 'export' | 'pdf' } & VendorLedgerTabFilters
) => {
    try {
        const { userId, userType, vendorId, format, ...filters } = payload;
        const resp = await ApiClient.get(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/statement/${format}`,
            { params: filters, responseType: 'blob' }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};

const TAX_DOCUMENTS: Record<VendorTaxDocumentTab, string> = {
    commissions: 'invoice',
    'credit-notes': 'credit-note',
};

export const downloadVendorTaxDocument = async (
    payload: UserPayload & {
        vendorId: string;
        tab: VendorTaxDocumentTab;
        source: VendorTaxDocumentSource;
        id: string;
    }
) => {
    try {
        const { userId, userType, vendorId, tab, source, id } = payload;
        const resp = await ApiClient.get(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/${tab}/${source}/${encodeURIComponent(id)}/${TAX_DOCUMENTS[tab]}`,
            { responseType: 'blob' }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};

const getTab = async <T>(
    payload: UserPayload & { vendorId: string; tab: string } & VendorLedgerTabFilters
) => {
    try {
        const { userId, userType, vendorId, tab, ...filters } = payload;
        const resp: SuccessGenericResponse<VendorLedgerTabResponse<T>> = await ApiClient.get(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/${tab}`,
            { params: filters }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadVendorLedgerTab = async (
    payload: UserPayload & {
        vendorId: string;
        tab: string;
        format: ExportFormat;
    } & Pick<VendorLedgerTabFilters, 'from' | 'to' | 'searchText' | 'status' | 'mode'>
) => {
    try {
        const { userId, userType, vendorId, tab, format, ...filters } = payload;
        const resp = await ApiClient.get(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/${tab}/export/${format}`,
            { params: filters, responseType: 'blob' }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};

export const getVendorTransactions = (
    payload: UserPayload & { vendorId: string } & VendorLedgerTabFilters
) => getTab<VendorTransactionEntry>({ ...payload, tab: 'transactions' });

export const getVendorCommissions = (
    payload: UserPayload & { vendorId: string } & VendorLedgerTabFilters
) => getTab<VendorCommissionEntry>({ ...payload, tab: 'commissions' });

export const getVendorDeposits = (
    payload: UserPayload & { vendorId: string } & VendorLedgerTabFilters
) => getTab<VendorDepositEntry>({ ...payload, tab: 'deposits' });

export const getVendorCreditNotes = (
    payload: UserPayload & { vendorId: string } & VendorLedgerTabFilters
) => getTab<VendorCreditNoteEntry>({ ...payload, tab: 'credit-notes' });

export const getVendorCostOfSales = (
    payload: UserPayload & { vendorId: string } & VendorLedgerTabFilters
) => getTab<VendorCostOfSalesEntry>({ ...payload, tab: 'cost-of-sales' });

export const getVendorDebitNotes = (
    payload: UserPayload & { vendorId: string } & VendorLedgerTabFilters
) => getTab<VendorDebitNoteEntry>({ ...payload, tab: 'debit-notes' });

export const createVendorDeposit = async (
    payload: UserPayload & { vendorId: string } & VendorDepositPayload
) => {
    try {
        const { userId, userType, vendorId, ...body } = payload;
        const resp: SuccessGenericResponse<VendorDepositEntry> = await ApiClient.post(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/deposits`,
            body
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

const createEntry = async (
    payload: UserPayload & { vendorId: string; tab: string } & VendorEntryPayload
) => {
    try {
        const { userId, userType, vendorId, tab, ...body } = payload;
        const resp: SuccessGenericResponse<VendorCreditNoteEntry> = await ApiClient.post(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/${tab}`,
            body
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const createVendorCreditNote = (
    payload: UserPayload & { vendorId: string } & VendorEntryPayload
) => createEntry({ ...payload, tab: 'credit-notes' });

export const createVendorCommission = (
    payload: UserPayload & { vendorId: string } & VendorEntryPayload
) => createEntry({ ...payload, tab: 'commissions' });

export const createVendorCostOfSales = (
    payload: UserPayload & { vendorId: string } & VendorEntryPayload
) => createEntry({ ...payload, tab: 'cost-of-sales' });

export const createVendorDebitNote = (
    payload: UserPayload & { vendorId: string } & VendorEntryPayload
) => createEntry({ ...payload, tab: 'debit-notes' });

export const createVendorOpeningBalance = async (
    payload: UserPayload & { vendorId: string } & VendorOpeningBalancePayload
) => {
    try {
        const { userId, userType, vendorId, ...body } = payload;
        const resp: SuccessGenericResponse<VendorDepositEntry> = await ApiClient.post(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/opening-balance`,
            body
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const reverseVendorDeposit = async (
    payload: UserPayload & { vendorId: string; id: number; reason: string }
) => {
    try {
        const { userId, userType, vendorId, id, reason } = payload;
        const resp: SuccessGenericResponse<VendorDepositEntry> = await ApiClient.patch(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/deposits/${id}/reverse`,
            { reason }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

const reverseEntry = async (
    payload: UserPayload & { vendorId: string; tab: string; id: number; reason: string }
) => {
    try {
        const { userId, userType, vendorId, tab, id, reason } = payload;
        const resp: SuccessGenericResponse<VendorCreditNoteEntry> = await ApiClient.patch(
            `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/${tab}/${id}/reverse`,
            { reason }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const reverseVendorCreditNote = (
    payload: UserPayload & { vendorId: string; id: number; reason: string }
) => reverseEntry({ ...payload, tab: 'credit-notes' });

export const reverseVendorCommission = (
    payload: UserPayload & { vendorId: string; id: number; reason: string }
) => reverseEntry({ ...payload, tab: 'commissions' });

export const reverseVendorCostOfSales = (
    payload: UserPayload & { vendorId: string; id: number; reason: string }
) => reverseEntry({ ...payload, tab: 'cost-of-sales' });

export const reverseVendorDebitNote = (
    payload: UserPayload & { vendorId: string; id: number; reason: string }
) => reverseEntry({ ...payload, tab: 'debit-notes' });

type VendorEntryTarget = UserPayload & { vendorId: string; id: number };

const vendorEntryUrl = ({ userId, userType, vendorId, id }: VendorEntryTarget, path: string) =>
    `${base({ userId, userType })}/${encodeURIComponent(vendorId)}/${path}/${id}`;

export const updateVendorDeposit = ({
    userId,
    userType,
    vendorId,
    id,
    ...body
}: VendorEntryTarget & VendorDepositPayload & LedgerChangeReason) =>
    putLedgerEntry<VendorDepositEntry>(
        vendorEntryUrl({ userId, userType, vendorId, id }, 'deposits'),
        body
    );

export const deleteVendorDeposit = ({
    reason,
    ...target
}: VendorEntryTarget & { reason: string }) =>
    deleteLedgerEntry<VendorDepositEntry>(vendorEntryUrl(target, 'deposits'), reason);

export const updateVendorOpeningBalance = ({
    userId,
    userType,
    vendorId,
    id,
    ...body
}: VendorEntryTarget & VendorOpeningBalancePayload & LedgerChangeReason) =>
    putLedgerEntry<VendorDepositEntry>(
        vendorEntryUrl({ userId, userType, vendorId, id }, 'opening-balance'),
        body
    );

export const deleteVendorOpeningBalance = ({
    reason,
    ...target
}: VendorEntryTarget & { reason: string }) =>
    deleteLedgerEntry<VendorDepositEntry>(vendorEntryUrl(target, 'opening-balance'), reason);

const updateManualEntry =
    (path: string) =>
    ({
        userId,
        userType,
        vendorId,
        id,
        ...body
    }: VendorEntryTarget & VendorEntryPayload & LedgerChangeReason) =>
        putLedgerEntry<VendorCreditNoteEntry>(
            vendorEntryUrl({ userId, userType, vendorId, id }, path),
            body
        );

const deleteManualEntry =
    (path: string) =>
    ({ reason, ...target }: VendorEntryTarget & { reason: string }) =>
        deleteLedgerEntry<VendorCreditNoteEntry>(vendorEntryUrl(target, path), reason);

export const updateVendorCreditNote = updateManualEntry('credit-notes');

export const deleteVendorCreditNote = deleteManualEntry('credit-notes');

export const updateVendorCommission = updateManualEntry('commissions');

export const deleteVendorCommission = deleteManualEntry('commissions');

export const updateVendorCostOfSales = updateManualEntry('cost-of-sales');

export const deleteVendorCostOfSales = deleteManualEntry('cost-of-sales');

export const updateVendorDebitNote = updateManualEntry('debit-notes');

export const deleteVendorDebitNote = deleteManualEntry('debit-notes');

type BooksMarkTarget = VendorEntryTarget & { synced: boolean };

const markVendorBooks =
    (path: string) =>
    ({ synced, ...target }: BooksMarkTarget) =>
        markLedgerBooks<VendorDepositEntry & VendorCreditNoteEntry>(
            `${vendorEntryUrl(target, path)}/books`,
            synced
        );

export const markVendorDepositBooks = markVendorBooks('deposits');

export const markVendorCreditNoteBooks = markVendorBooks('credit-notes');

export const markVendorCommissionBooks = markVendorBooks('commissions');

export const markVendorCostOfSalesBooks = markVendorBooks('cost-of-sales');

export const markVendorDebitNoteBooks = markVendorBooks('debit-notes');
