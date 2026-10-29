import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    DueThisWeekResponse,
    GetPaymentTransactionsPayload,
    GetReminderRulesResponse,
    PaymentDashboardData,
    PaymentTransactionDetailsResponse,
    PaymentTransactionsResponse,
    RecentActivityResponse,
    TopCustomersResponse,
} from '../types/payments';

export const getPaymentDashboard = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<PaymentDashboardData> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/payments/dashboard`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getDueThisWeekApi = async (
    payload: UserPayload & { page: number; itemsPerPage: number }
) => {
    try {
        const { userId, userType, page, itemsPerPage } = payload;
        const resp: SuccessGenericResponse<DueThisWeekResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/payments/dashboard/due-this-week`,
            { params: { page, itemsPerPage } }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const getTopCustomersApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<TopCustomersResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/payments/dashboard/top-customers`
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const getRecentActivityApi = async (
    payload: UserPayload & { page: number; itemsPerPage: number }
) => {
    try {
        const { userId, userType, page, itemsPerPage } = payload;
        const resp: SuccessGenericResponse<RecentActivityResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/payments/dashboard/recent-activity`,
            { params: { page, itemsPerPage } }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const getPaymentLinkTransactions = async (
    payload: UserPayload & GetPaymentTransactionsPayload
) => {
    try {
        const { userId, userType, searchText, ...params } = payload;
        const resp: SuccessGenericResponse<PaymentTransactionsResponse> = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/transactions`,
            {
                params: {
                    ...params,
                    accessKey: 'invoice',
                    search: searchText || undefined,
                },
            }
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const getPaymentTransactionDetails = async (
    payload: UserPayload & { transactionId: string }
) => {
    try {
        const { userId, userType, transactionId } = payload;
        const resp: SuccessGenericResponse<PaymentTransactionDetailsResponse> = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/transactions/invoice/${transactionId}`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const downloadPaymentReceiptApi = async (
    payload: UserPayload & { invoiceId: string | number }
) => {
    try {
        const { userId, userType, invoiceId } = payload;
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/transactions/invoice/${invoiceId}/pdf`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const updateReminderRuleApi = async (
    payload: UserPayload & {
        ruleId: number;
        enabled: boolean;
        days: number;
        sendEmail: boolean;
        sendWhatsApp: boolean;
        emailTemplate: { subject: string; body: string };
        whatsappTemplate: { body: string };
    }
) => {
    try {
        const { userId, userType, ruleId, ...body } = payload;
        const resp = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/reminder-rules/${ruleId}`,
            body
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const updateAutomaticRemindersApi = async (
    payload: UserPayload & { automaticReminders: boolean }
) => {
    try {
        const { userId, userType, automaticReminders } = payload;
        const resp: SuccessGenericResponse<unknown> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/reminder-rules/automatic`,
            { automaticReminders: String(automaticReminders) }
        );
        return resp.status;
    } catch {
        return false;
    }
};

export const getReminderRulesApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<GetReminderRulesResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/reminder-rules`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const exportPaymentTransactions = async (
    payload: UserPayload & {
        type: 'excel' | 'csv' | 'pdf';
        sortField?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
        paymentMethod?: string;
        searchText?: string;
        accessKey?: string;
    }
) => {
    try {
        const {
            userId,
            userType,
            type,
            sortField,
            startDate,
            endDate,
            status,
            paymentMethod,
            searchText,
            accessKey,
        } = payload;
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/transactions/invoice/export/${type}`,
            {
                params: {
                    sortField,
                    startDate,
                    endDate,
                    status,
                    paymentMethod,
                    search: searchText,
                    accessKey,
                },
            }
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};
