import { SuccessGenericResponse } from '@customtypes/api';
import { UserPayload } from '@customtypes/general';
import { AddressListResponse } from '@domains/dashboard/profile/types/index';
import { ApiClient } from '@src/services/config';

import {
    ApplicantDocumentRequired,
    ApplicationStatus,
    CountryFlag,
    CreateVisaOrderPayload,
    CreateVisaOrderResponse,
    NationalityResidencyResponse,
    StageVisaDocumentResponse,
    UploadDocumentPayload,
    UploadDocumentResponse,
    VisaContent,
    VisaCountry,
    VisaDestination,
    VisaOrderDetails,
    VisaProduct,
    VisaProductDocument,
    VisaSearchQueryParams,
} from '../types/visa';

// ─── API Functions ────────────────────────────────────────────────────────────

export const getVisaDestinations = async (payload: UserPayload): Promise<VisaDestination[] | false> => {
    try {
        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/visa/destinations`
        );
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

export const getVisaCountries = async (payload: UserPayload): Promise<VisaCountry[] | false> => {
    try {
        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/visa/countries`
        );
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

// Deliberately NOT under {userType}/{userId}/travel — flag images are static/public data, not
// scoped to any user. Routed via the vendor/webhooks tree (unauthenticated by design, same as other
// vendor callbacks) and served with each flag's SVG inlined as a base64 data URI, so there's no
// separate image request that would need to reach travel's own host directly (blocked by ingress on
// some deployments) or carry session/JWT headers (which a plain <img src> load never can).
export const getCountryFlags = async (): Promise<CountryFlag[] | false> => {
    try {
        const resp = await ApiClient.get('vendor/countryFlag/travel/flags');
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

export const getNationalityAndResidency = async (payload: UserPayload): Promise<NationalityResidencyResponse | false> => {
    try {
        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/visa/nationality-residency`
        );
        const data = resp?.data ?? resp;
        if (!data || typeof data !== 'object') return false;
        return {
            nationality: Array.isArray(data.nationality) ? data.nationality : [],
            residency: Array.isArray(data.residency) ? data.residency : [],
        };
    } catch {
        return false;
    }
};

export const searchVisaOptions = async (
    payload: UserPayload & VisaSearchQueryParams
): Promise<VisaProduct[] | false> => {
    try {
        const { userType, userId, ...params } = payload;
        const resp = await ApiClient.get(
            `${userType}/${userId}/travel/visa/search`,
            { params }
        );
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

export const getVisaProductDocuments = async (
    payload: UserPayload & { product_id: number }
): Promise<VisaProductDocument[] | false> => {
    try {
        const { userType, userId, product_id } = payload;
        const resp = await ApiClient.get(
            `${userType}/${userId}/travel/visa/product-documents`,
            { params: { product_id } }
        );
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

export const getVisaProductContent = async (
    payload: UserPayload & { visatype: string; residency: number; nationality: number }
): Promise<VisaContent | false> => {
    try {
        const { userType, userId, ...params } = payload;
        const resp = await ApiClient.get(
            `${userType}/${userId}/travel/visa/product-content`,
            { params }
        );
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

export const createVisaOrder = async (
    payload: UserPayload & CreateVisaOrderPayload
): Promise<CreateVisaOrderResponse | false> => {
    try {
        const { userType, userId, ...body } = payload;
        const resp: CreateVisaOrderResponse = await ApiClient.post(
            `${userType}/${userId}/travel/visa/order/create`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const stageVisaDocument = async (
    payload: UserPayload & { file: File; document_code: string }
): Promise<StageVisaDocumentResponse | false> => {
    try {
        const { userType, userId, file, document_code } = payload;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_code', document_code);
        const resp: StageVisaDocumentResponse = await ApiClient.post(
            `${userType}/${userId}/travel/visa/order/stage-document`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return resp;
    } catch {
        return false;
    }
};

export const getApplicantDocuments = async (
    payload: UserPayload & { application_id: number; order_number: string }
): Promise<ApplicantDocumentRequired[] | false> => {
    try {
        const { userType, userId, application_id, order_number } = payload;
        const resp = await ApiClient.get(
            `${userType}/${userId}/travel/visa/order/applicant-documents`,
            { params: { application_id, order_number } }
        );
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

export const uploadApplicantDocument = async (
    payload: UserPayload & UploadDocumentPayload
): Promise<UploadDocumentResponse | false> => {
    try {
        const { userType, userId, file, document_code, application_id, order_number } = payload;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_code', document_code);
        formData.append('application_id', String(application_id));
        formData.append('order_number', order_number);
        const resp: UploadDocumentResponse = await ApiClient.post(
            `${userType}/${userId}/travel/visa/order/upload-document`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return resp;
    } catch {
        return false;
    }
};

export const getApplicationStatus = async (
    payload: UserPayload & { application_id: number; order_number: string }
): Promise<ApplicationStatus | false> => {
    try {
        const { userType, userId, application_id, order_number } = payload;
        const resp = await ApiClient.get(
            `${userType}/${userId}/travel/visa/order/application-status`,
            { params: { application_id, order_number } }
        );
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

export const getOrderStatus = async (
    payload: UserPayload & { order_number: string }
): Promise<VisaOrderDetails | false> => {
    try {
        const { userType, userId, order_number } = payload;
        const resp = await ApiClient.get(
            `${userType}/${userId}/travel/visa/order/status`,
            { params: { order_number } }
        );
        return resp?.data ?? resp;
    } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404 || status === 403) throw err;
        return false;
    }
};

export const listVisaApplications = async (
    payload: UserPayload & {
        limit?: number;
        page?: number;
        searchText?: string;
        fromDate?: string;
        toDate?: string;
    }
): Promise<{ data: any[]; total: number } | false> => {
    try {
        const { userType, userId, limit = 10, page = 1, searchText, fromDate, toDate } = payload;
        const resp = await ApiClient.get(
            `${userType}/${userId}/travel/visa/applications`,
            { params: { limit, page, searchText, fromDate, toDate } }
        );
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

export const listVisaBookings = async (
    payload: UserPayload & {
        limit?: number;
        page?: number;
        from?: string;
        to?: string;
        paymentStatus?: string;
        applicationStatus?: string;
    }
): Promise<{ data: any[]; total: number } | false> => {
    try {
        const { userType, userId, ...params } = payload;
        const resp = await ApiClient.get(
            `${userType}/${userId}/travel/visa/bookings`,
            { params }
        );
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

export const getVisaOrderDetails = async (
    payload: UserPayload & { order_number: string }
): Promise<VisaOrderDetails | false> => {
    try {
        const { userType, userId, order_number } = payload;
        const resp = await ApiClient.get(
            `${userType}/${userId}/travel/visa/order/details`,
            { params: { order_number } }
        );
        return resp?.data ?? resp;
    } catch {
        return false;
    }
};

export const getVisaAddresses = async (payload: UserPayload): Promise<AddressListResponse | false> => {
    try {
        const resp: SuccessGenericResponse<AddressListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/visa/addressDetails`
        );
        return resp.data;
    } catch {
        return false;
    }
};
