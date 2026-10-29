import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CommissionInvoice,
    CommissionInvoiceBilledTo,
    CommissionInvoiceMatch,
    CommissionInvoicePreview,
    CommissionInvoiceTarget,
} from '../types/commissionInvoice';

const base = ({ userType, userId }: UserPayload) => `${userType}/${userId}/others/accounting`;

const invoiceUrl = (
    payload: UserPayload,
    { vendorId, source, id }: CommissionInvoiceTarget,
    leaf: string
) =>
    `${base(payload)}/vendors/${encodeURIComponent(String(vendorId))}/commissions/${source}/${encodeURIComponent(id)}/invoice/${leaf}`;

export const searchCommissionInvoices = async (payload: UserPayload & { search: string }) => {
    try {
        const { userId, userType, search } = payload;
        const resp: SuccessGenericResponse<{ matches: CommissionInvoiceMatch[] }> =
            await ApiClient.get(`${base({ userId, userType })}/commission-invoices`, {
                params: { search },
            });
        return resp.data.matches;
    } catch (err) {
        return false;
    }
};

export const getCommissionInvoice = async (payload: UserPayload & CommissionInvoiceTarget) => {
    try {
        const { userId, userType, ...target } = payload;
        const resp: SuccessGenericResponse<CommissionInvoice> = await ApiClient.get(
            invoiceUrl({ userId, userType }, target, 'details'),
            { skipErrorToast: true }
        );
        return resp.data;
    } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        return status === 404 ? null : false;
    }
};

export const previewCommissionInvoice = async (
    payload: UserPayload & CommissionInvoiceTarget & { billedTo: CommissionInvoiceBilledTo }
) => {
    try {
        const { userId, userType, billedTo, ...target } = payload;
        const resp: SuccessGenericResponse<CommissionInvoicePreview> = await ApiClient.post(
            invoiceUrl({ userId, userType }, target, 'preview'),
            { billedTo },
            { skipErrorToast: true }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const saveCommissionInvoiceBilledTo = async (
    payload: UserPayload & CommissionInvoiceTarget & { billedTo: CommissionInvoiceBilledTo }
) => {
    try {
        const { userId, userType, billedTo, ...target } = payload;
        const resp: SuccessGenericResponse<CommissionInvoice> = await ApiClient.put(
            invoiceUrl({ userId, userType }, target, 'billed-to'),
            billedTo
        );
        return { invoice: resp.data, message: resp.message };
    } catch (err) {
        return false;
    }
};

export const sendCommissionInvoice = async (
    payload: UserPayload & CommissionInvoiceTarget & { to: string[] }
) => {
    try {
        const { userId, userType, to, ...target } = payload;
        const resp: SuccessGenericResponse<CommissionInvoice> = await ApiClient.post(
            invoiceUrl({ userId, userType }, target, 'send'),
            { to }
        );
        return { invoice: resp.data, message: resp.message };
    } catch (err) {
        return false;
    }
};
