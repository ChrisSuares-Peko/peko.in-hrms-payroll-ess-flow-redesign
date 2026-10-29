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
    PaymentGatewayDetailResponse,
    PaymentGatewayFeePayload,
    PaymentGatewayListResponse,
    PaymentGatewayOpeningBalancePayload,
    PaymentGatewaySettlementEntry,
    PaymentGatewaySettlementPayload,
    PaymentGatewaySettlementSuggestion,
    PaymentGatewaySettlementsResponse,
    PaymentGatewayStatementResponse,
    PaymentGatewayTabFilters,
    PaymentGatewayTabResponse,
    PaymentGatewayTransactionEntry,
} from '../types/paymentGatewayLedger';

const base = ({ userType, userId }: UserPayload) =>
    `${userType}/${userId}/others/accounting/payment-gateways`;

const gatewayPath = (payload: UserPayload & { gatewayId: string }) =>
    `${base({ userId: payload.userId, userType: payload.userType })}/${encodeURIComponent(payload.gatewayId)}`;

export const getPaymentGatewayList = async (
    payload: UserPayload & {
        page: number;
        itemsPerPage: number;
        searchText: string;
        refresh?: boolean;
    }
) => {
    try {
        const { userId, userType, refresh, ...filters } = payload;
        const resp: SuccessGenericResponse<PaymentGatewayListResponse> = await ApiClient.get(
            base({ userId, userType }),
            { params: { ...filters, ...(refresh ? { refresh: 1 } : {}) } }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getPaymentGatewayDetail = async (
    payload: UserPayload & { gatewayId: string; from?: string; to?: string }
) => {
    try {
        const { from, to } = payload;
        const resp: SuccessGenericResponse<PaymentGatewayDetailResponse> = await ApiClient.get(
            gatewayPath(payload),
            { params: from && to ? { from, to } : {}, skipErrorToast: true }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadPaymentGatewayLedgerTab = async (
    payload: UserPayload & {
        gatewayId: string;
        tab: string;
        format: ExportFormat;
    } & Pick<PaymentGatewayTabFilters, 'from' | 'to' | 'searchText' | 'status' | 'mode'>
) => {
    try {
        const { userId, userType, gatewayId, tab, format, ...filters } = payload;
        const resp = await ApiClient.get(
            `${gatewayPath({ userId, userType, gatewayId })}/${tab}/export/${format}`,
            { params: filters, responseType: 'blob' }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};

export const getPaymentGatewayTransactions = async (
    payload: UserPayload & { gatewayId: string } & PaymentGatewayTabFilters
) => {
    try {
        const { userId, userType, gatewayId, ...filters } = payload;
        const resp: SuccessGenericResponse<
            PaymentGatewayTabResponse<PaymentGatewayTransactionEntry>
        > = await ApiClient.get(`${gatewayPath({ userId, userType, gatewayId })}/transactions`, {
            params: filters,
        });
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getPaymentGatewaySettlements = async (
    payload: UserPayload & { gatewayId: string; feePage?: number } & PaymentGatewayTabFilters
) => {
    try {
        const { userId, userType, gatewayId, ...filters } = payload;
        const resp: SuccessGenericResponse<PaymentGatewaySettlementsResponse> = await ApiClient.get(
            `${gatewayPath({ userId, userType, gatewayId })}/settlements`,
            {
                params: filters,
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getPaymentGatewaySettlementSuggestion = async (
    payload: UserPayload & { gatewayId: string }
) => {
    try {
        const resp: SuccessGenericResponse<PaymentGatewaySettlementSuggestion> =
            await ApiClient.get(`${gatewayPath(payload)}/settlements/suggestion`);
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const createPaymentGatewaySettlement = async (
    payload: UserPayload & { gatewayId: string } & PaymentGatewaySettlementPayload
) => {
    try {
        const { userId, userType, gatewayId, ...body } = payload;
        const resp: SuccessGenericResponse<{
            receipt: PaymentGatewaySettlementEntry;
        }> = await ApiClient.post(
            `${gatewayPath({ userId, userType, gatewayId })}/settlements`,
            body
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const createPaymentGatewayFee = async (
    payload: UserPayload & { gatewayId: string } & PaymentGatewayFeePayload
) => {
    try {
        const { userId, userType, gatewayId, ...body } = payload;
        const resp: SuccessGenericResponse<{
            fee: PaymentGatewaySettlementEntry;
        }> = await ApiClient.post(`${gatewayPath({ userId, userType, gatewayId })}/fees`, body);
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const createPaymentGatewayOpeningBalance = async (
    payload: UserPayload & { gatewayId: string } & PaymentGatewayOpeningBalancePayload
) => {
    try {
        const { userId, userType, gatewayId, ...body } = payload;
        const resp: SuccessGenericResponse<PaymentGatewaySettlementEntry> = await ApiClient.post(
            `${gatewayPath({ userId, userType, gatewayId })}/opening-balance`,
            body
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const reversePaymentGatewaySettlement = async (
    payload: UserPayload & { gatewayId: string; id: number; reason: string }
) => {
    try {
        const { userId, userType, gatewayId, id, reason } = payload;
        const resp: SuccessGenericResponse<PaymentGatewaySettlementEntry[]> = await ApiClient.patch(
            `${gatewayPath({ userId, userType, gatewayId })}/settlements/${id}/reverse`,
            { reason }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const reversePaymentGatewayFee = async (
    payload: UserPayload & { gatewayId: string; id: number; reason: string }
) => {
    try {
        const { userId, userType, gatewayId, id, reason } = payload;
        const resp: SuccessGenericResponse<PaymentGatewaySettlementEntry[]> = await ApiClient.patch(
            `${gatewayPath({ userId, userType, gatewayId })}/fees/${id}/reverse`,
            { reason }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getPaymentGatewayStatement = async (
    payload: UserPayload & { gatewayId: string } & PaymentGatewayTabFilters
) => {
    try {
        const { userId, userType, gatewayId, ...filters } = payload;
        const resp: SuccessGenericResponse<PaymentGatewayStatementResponse> = await ApiClient.get(
            `${gatewayPath({ userId, userType, gatewayId })}/statement`,
            { params: filters }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadPaymentGatewayStatement = async (
    payload: UserPayload & {
        gatewayId: string;
        format: 'export' | 'pdf';
    } & PaymentGatewayTabFilters
) => {
    try {
        const { userId, userType, gatewayId, format, ...filters } = payload;
        const resp = await ApiClient.get(
            `${gatewayPath({ userId, userType, gatewayId })}/statement/${format}`,
            { params: filters, responseType: 'blob' }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};

type GatewayEntryTarget = UserPayload & { gatewayId: string; id: number };

const gatewayEntryUrl = ({ userId, userType, gatewayId, id }: GatewayEntryTarget, path: string) =>
    `${gatewayPath({ userId, userType, gatewayId })}/${path}/${id}`;

const updateGatewayEntry =
    (path: string) =>
    ({
        userId,
        userType,
        gatewayId,
        id,
        ...body
    }: GatewayEntryTarget & PaymentGatewaySettlementPayload & LedgerChangeReason) =>
        putLedgerEntry<PaymentGatewaySettlementEntry>(
            gatewayEntryUrl({ userId, userType, gatewayId, id }, path),
            body
        );

const deleteGatewayEntry =
    (path: string) =>
    ({ reason, ...target }: GatewayEntryTarget & { reason: string }) =>
        deleteLedgerEntry<PaymentGatewaySettlementEntry>(gatewayEntryUrl(target, path), reason);

export const updatePaymentGatewaySettlement = updateGatewayEntry('settlements');

export const deletePaymentGatewaySettlement = deleteGatewayEntry('settlements');

export const updatePaymentGatewayFee = updateGatewayEntry('fees');

export const deletePaymentGatewayFee = deleteGatewayEntry('fees');

export const updatePaymentGatewayOpeningBalance = ({
    userId,
    userType,
    gatewayId,
    id,
    ...body
}: GatewayEntryTarget & PaymentGatewayOpeningBalancePayload & LedgerChangeReason) =>
    putLedgerEntry<PaymentGatewaySettlementEntry>(
        gatewayEntryUrl({ userId, userType, gatewayId, id }, 'opening-balance'),
        body
    );

export const deletePaymentGatewayOpeningBalance = deleteGatewayEntry('opening-balance');

const markGatewayBooks =
    (path: string) =>
    ({ synced, ...target }: GatewayEntryTarget & { synced: boolean }) =>
        markLedgerBooks<PaymentGatewaySettlementEntry>(
            `${gatewayEntryUrl(target, path)}/books`,
            synced
        );

export const markPaymentGatewaySettlementBooks = markGatewayBooks('settlements');

export const markPaymentGatewayFeeBooks = markGatewayBooks('fees');
