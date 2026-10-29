import axios from 'axios';

import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';
import { EInvoiceApiClient } from '@src/services/eInvoiceConfig';

import { EInvoiceDashboardApiResponse } from '../types/eInvoice';
import { EInvoiceDetailsApiResponse } from '../types/eInvoiceDetails';
import { EInvoiceAllApiResponse, GetEInvoiceAllParams } from '../types/eInvoiceRegister';
import { GenerateEWaybillPayload } from '../types/eWaybill';
import { GenerateIrnPayload } from '../types/generateIrn';
import { GstinApiResponse } from '../types/gstinLookup';

export interface EInvoiceAuthResponse {
    authToken: string;
    tokenExpiry: string;
    gstin: string;
    username: string;
}

export interface EInvoiceSessionStatusData {
    authToken: string;
    tokenExpiry: string;
    gstin: string;
    username: string;
}

export const eInvoiceSignInApi = async (
    payload: UserPayload & { gstin: string; username: string; password: string }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<EInvoiceAuthResponse> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/e-invoice/auth`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getEInvoiceNextNumberApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<{ nextNumber: number }> = await EInvoiceApiClient.get(
            `${userType}/${userId}/officeAndBusiness/e-invoice/next-number`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const generateIrnApi = async (payload: UserPayload & { body: GenerateIrnPayload }) => {
    try {
        const { userId, userType, body } = payload;
        const resp: SuccessGenericResponse<{ id: number; irn: string; ackNo: string; ackDate: string }> =
            await EInvoiceApiClient.post(
                `${userType}/${userId}/officeAndBusiness/e-invoice/generate-irn`,
                body
            );
        return resp;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
            return error.response.data as SuccessGenericResponse<{ id: number; irn: string; ackNo: string; ackDate: string }>;
        }
        return null;
    }
};

export const getEInvoiceAllApi = async (
    payload: UserPayload & { params: GetEInvoiceAllParams }
) => {
    try {
        const { userId, userType, params } = payload;
        const resp: SuccessGenericResponse<EInvoiceAllApiResponse> = await EInvoiceApiClient.get(
            `${userType}/${userId}/officeAndBusiness/e-invoice/all`,
            { params }
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const getEInvoiceDetailsApi = async (
    payload: UserPayload & { invoiceId: string }
) => {
    try {
        const { userId, userType, invoiceId } = payload;
        const resp: SuccessGenericResponse<EInvoiceDetailsApiResponse> = await EInvoiceApiClient.get(
            `${userType}/${userId}/officeAndBusiness/e-invoice/${invoiceId}`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const getEInvoiceDashboardApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<EInvoiceDashboardApiResponse> = await EInvoiceApiClient.get(
            `${userType}/${userId}/officeAndBusiness/e-invoice/dashboard`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export interface EInvoiceUsageApiResponse {
    used: number;
    freeBaseLimit: number;
    addonLimit: number;
    maxLimit: number;
    cycleStart: string;
    cycleEnd: string;
    currentPlanName: string | null;
    currentPlanBillingType: 'MONTHLY' | 'ANNUALLY' | null;
    currentPlanAmountPaid: string | number | null;
    currentPlanStatus: string | null;
    lastEInvoiceCreatedAt: string | null;
}

export const getEInvoiceUsageApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<EInvoiceUsageApiResponse> = await EInvoiceApiClient.get(
            `${userType}/${userId}/officeAndBusiness/e-invoice/usage`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const generateEWaybillApi = async (
    payload: UserPayload & { invoiceId: string; body: GenerateEWaybillPayload }
) => {
    try {
        const { userId, userType, invoiceId, body } = payload;
        const resp: SuccessGenericResponse<unknown> = await EInvoiceApiClient.post(
            `${userType}/${userId}/officeAndBusiness/e-invoice/generate-ewaybill/${invoiceId}`,
            body
        );
        return resp;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
            return error.response.data as SuccessGenericResponse<unknown>;
        }
        return null;
    }
};

export const getEInvoiceSessionStatusApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<EInvoiceSessionStatusData> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/e-invoice/session-status`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const getGstinLookupApi = async (
    payload: UserPayload & { gstin: string }
) => {
    try {
        const { userId, userType, gstin } = payload;
        const resp: SuccessGenericResponse<GstinApiResponse> = await EInvoiceApiClient.get(
            `${userType}/${userId}/officeAndBusiness/e-invoice/gstin/${gstin}`
        );
        return resp.data
            ? { data: resp.data, message: null }
            : { data: null, message: resp.message ?? null };
    } catch {
        return { data: null, message: null };
    }
};

export const cancelEWaybillApi = async (
    payload: UserPayload & { invoiceId: string; cancelReason: string }
) => {
    try {
        const { userId, userType, invoiceId, cancelReason } = payload;
        const resp: SuccessGenericResponse<unknown> = await EInvoiceApiClient.post(
            `${userType}/${userId}/officeAndBusiness/e-invoice/cancel-ewaybill/${invoiceId}`,
            { cancelReason }
        );
        return resp;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
            return error.response.data as SuccessGenericResponse<unknown>;
        }
        return null;
    }
};

export const cancelIrnApi = async (
    payload: UserPayload & { invoiceId: string; cancelReason: string; cancelRemark: string }
) => {
    try {
        const { userId, userType, invoiceId, cancelReason, cancelRemark } = payload;
        const resp: SuccessGenericResponse<unknown> = await EInvoiceApiClient.post(
            `${userType}/${userId}/officeAndBusiness/e-invoice/cancel-irn/${invoiceId}`,
            { cancelReason, cancelRemark }
        );
        return resp;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
            return error.response.data as SuccessGenericResponse<unknown>;
        }
        return null;
    }
};

export const downloadEInvoicePdfApi = async (
    payload: UserPayload & { invoiceId: string }
) => {
    try {
        const { userId, userType, invoiceId } = payload;
        const resp: SuccessGenericResponse<{ pdfBuffer: { type: string; data: number[] } | string }> =
            await EInvoiceApiClient.get(
                `${userType}/${userId}/officeAndBusiness/e-invoice/download-pdf/${invoiceId}`
            );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const eInvoiceLogoutApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await EInvoiceApiClient.post(
            `${userType}/${userId}/officeAndBusiness/e-invoice/logout`
        );
        return resp;
    } catch {
        return false;
    }
};
