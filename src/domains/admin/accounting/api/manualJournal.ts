import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ManualJournalAccount,
    ManualJournalEntryPayload,
    ManualJournalKey,
    ManualJournalLookup,
    ManualJournalPreview,
    ManualJournalPreviewPayload,
    ManualJournalResult,
    ManualJournalSetup,
    ManualJournalSplitTemplate,
} from '../types/manualJournal';

const base = ({ userType, userId }: UserPayload) =>
    `${userType}/${userId}/others/accounting/manual-operations`;

const reasonOf = (error: unknown) =>
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? null;

export const getManualJournal = async (payload: UserPayload & { corporateTxnId: string }) => {
    try {
        const { userId, userType, corporateTxnId } = payload;
        const resp: SuccessGenericResponse<ManualJournalLookup> = await ApiClient.get(
            `${base({ userId, userType })}/journal/${encodeURIComponent(corporateTxnId)}`
        );
        return resp.data;
    } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        return status === 404 ? null : false;
    }
};

export const getManualJournalAccounts = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<{ accounts: ManualJournalAccount[] }> =
            await ApiClient.get(`${base(payload)}/accounts`);
        return resp.data.accounts;
    } catch (error) {
        return false;
    }
};

export const generateManualJournalSplit = async (
    payload: UserPayload & {
        corporateTxnId: string;
        journalKey: ManualJournalKey;
        setup: ManualJournalSetup;
    }
) => {
    try {
        const { userId, userType, corporateTxnId, journalKey, setup } = payload;
        const resp: SuccessGenericResponse<ManualJournalSplitTemplate> = await ApiClient.post(
            `${base({ userId, userType })}/journal/${encodeURIComponent(corporateTxnId)}/${journalKey}/split`,
            setup
        );
        return resp.data;
    } catch (error) {
        return false;
    }
};

export const previewManualJournal = async (
    payload: UserPayload & {
        corporateTxnId: string;
        journalKey: ManualJournalKey;
    } & ManualJournalPreviewPayload
) => {
    try {
        const { userId, userType, corporateTxnId, journalKey, ...body } = payload;
        const resp: SuccessGenericResponse<ManualJournalPreview> = await ApiClient.post(
            `${base({ userId, userType })}/journal/${encodeURIComponent(corporateTxnId)}/${journalKey}/preview`,
            body
        );
        return resp.data;
    } catch (error) {
        return {
            ok: false,
            lineItems: [],
            journalAccountIds: null,
            balanced: false,
            reason: reasonOf(error),
        };
    }
};

export const postManualJournal = async (
    payload: UserPayload & {
        corporateTxnId: string;
        journalKey: ManualJournalKey;
    } & ManualJournalEntryPayload
): Promise<ManualJournalResult> => {
    try {
        const { userId, userType, corporateTxnId, journalKey, ...body } = payload;
        const url = `${base({ userId, userType })}/journal/${encodeURIComponent(corporateTxnId)}/${journalKey}`;
        const resp: SuccessGenericResponse<ManualJournalResult> = await ApiClient.post(url, body);
        return resp.data;
    } catch (error) {
        return { success: false, reason: reasonOf(error) };
    }
};
