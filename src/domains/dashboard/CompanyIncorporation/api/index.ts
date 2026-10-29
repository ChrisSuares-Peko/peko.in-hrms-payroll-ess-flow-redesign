import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ApplicationResponse,
    Application,
    ApplicationsListResponse,
    LandingConfigResponse,
} from '../types';
import { parseBeValidationError } from '../utils/parseBeValidationError';

export type SubmitApplicationResult =
    | { ok: true; data: ApplicationResponse }
    | { ok: false; validationError: string | null };

// Get landing page configuration (pricing, services, required docs)
export const getLandingConfig = async (payload: { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<LandingConfigResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/company-incorporation/config`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getNIc = async (payload: { userId: number; userType: string; parent?: string }) => {
    try {
        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/company-incorporation/nic`,
            {
                params: payload.parent ? { parent: payload.parent } : {},
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const submitApplication = async (payload: {
    userId: number;
    userType: string;
    body: Record<string, unknown>;
}): Promise<SubmitApplicationResult> => {
    try {
        const resp: SuccessGenericResponse<ApplicationResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/company-incorporation/apply`,
            payload.body
        );
        return { ok: true, data: resp.data };
    } catch (err: any) {
        const status = err?.response?.status;
        const rawMessage =
            err?.response?.data?.message || err?.response?.data?.error || null;
        // Only treat 400 with a parseable message as a validation error;
        // other failures fall back to the generic toast.
        if (status === 400 && rawMessage) {
            return { ok: false, validationError: parseBeValidationError(rawMessage) };
        }
        return { ok: false, validationError: null };
    }
};

// Fetch all applications for the user
export const getApplications = async (payload: { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<ApplicationsListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/company-incorporation/applications`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

// Fetch single application detail
export const getApplicationDetail = async (payload: {
    userId: number;
    userType: string;
    applicationId: string;
}) => {
    try {
        const resp: SuccessGenericResponse<Application> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/company-incorporation/applications/${encodeURIComponent(payload.applicationId)}`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const uploadDocument = async (payload: {
    userId: number;
    userType: string;
    applicationId: string;
    docType: string;
    fileName: string;
    fileBase64: string;
    mimeType: string;
}) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ docType: string; fileUrl: string }> =
            await ApiClient.post(
                `${userType}/${userId}/officeAndBusiness/company-incorporation/upload-document`,
                body
            );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const confirmPayment = async (payload: {
    userId: number;
    userType: string;
    applicationId: string;
    corporateTxnId: string;
}) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ applicationId: string; status: string }> =
            await ApiClient.post(
                `${userType}/${userId}/officeAndBusiness/company-incorporation/confirm-payment`,
                body
            );
        return resp.data;
    } catch (err) {
        return false;
    }
};
