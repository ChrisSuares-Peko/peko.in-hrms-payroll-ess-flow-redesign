import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import type { SendForESignPayload, ResendSignatoryPayload, UpdateDocumentPayload } from '../types';

export const fetchIndianStates = async () => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get('user/general/indian-states');
        return resp.data?.states ?? [];
    } catch {
        return [];
    }
};

export const fetchTemplateById = async ({
    userId,
    userType,
    templateId,
}: {
    userId: number;
    userType: string;
    templateId: string;
}) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/legalService/templates/${templateId}`
        );
        const { data } = resp;
        return data;
    } catch {
        return false;
    }
};

export const updateLegalDocument = async ({
    userId,
    userType,
    documentId,
    editorHtml,
}: UpdateDocumentPayload & { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/legalService/document/${documentId}`,
            { editorHtml }
        );
        const { data } = resp;
        return data;
    } catch {
        return false;
    }
};

export const createLegalDocument = async ({
    userId,
    userType,
    title,
    editorHtml,
}: {
    userId: number;
    userType: string;
    title: string;
    editorHtml: string;
}) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/legalService/document`,
            { title, editorHtml }
        );
        const { data } = resp;
        return data;
    } catch {
        return false;
    }
};

const bufferToBlob = (resp: any): Blob | null => {
    const pdfBuffer = resp?.data?.pdfBuffer;
    if (!pdfBuffer) return null;
    const bufferData = Array.isArray(pdfBuffer)
        ? pdfBuffer
        : (pdfBuffer?.data ?? Object.values(pdfBuffer));
    if (!bufferData?.length) return null;
    const bytes = new Uint8Array(bufferData);
    return new Blob([bytes], { type: 'application/pdf' });
};

export const downloadDocument = async ({
    userId,
    userType,
    documentId,
}: {
    userId: number;
    userType: string;
    documentId: string;
}): Promise<{ blob: Blob } | { error: string } | null> => {
    try {
        const resp = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/legalService/document/${documentId}/download`
        );
        const blob = bufferToBlob(resp);
        return blob ? { blob } : null;
    } catch (err: any) {
        const message = err?.response?.data?.message;
        if (message) return { error: message };
        return null;
    }
};

export const savePersonalTemplate = async ({
    userId,
    userType,
    title,
    iconKey,
    category,
    timeEstimate,
    html,
}: {
    userId: number;
    userType: string;
    title: string;
    iconKey?: string;
    category?: string;
    timeEstimate?: string;
    html: string;
}) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/legalService/personal-templates`,
            { title, iconKey, category, timeEstimate, html }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const fetchPersonalTemplates = async ({
    userId,
    userType,
    limit,
    searchText = '',
    page,
}: {
    userId: number;
    userType: string;
    limit?: number;
    searchText?: string;
    page?: number;
}) => {
    try {
        const params: Record<string, any> = {};
        if (searchText) params.searchText = searchText;
        if (limit) params.limit = limit;
        if (page) params.page = page;
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/legalService/personal-templates`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const fetchPersonalTemplateById = async ({
    userId,
    userType,
    templateId,
}: {
    userId: number;
    userType: string;
    templateId: string;
}) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/legalService/personal-templates/${templateId}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const resendSignatoryApi = async ({
    userId,
    userType,
    eSignId,
    email,
    name,
}: ResendSignatoryPayload & { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/e-sign/resend-invitation?id=${eSignId}`,
            { email, name }
        );
        return resp;
    } catch {
        return false;
    }
};

export const sendForESignApi = async ({
    userId,
    userType,
    ...body
}: SendForESignPayload & { userId: number; userType: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/e-sign/sign-request`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

interface LegalDocumentsResponse {
    data: any[];
    count: number;
}

export const fetchLegalDocumentById = async ({
    userId,
    userType,
    documentId,
}: {
    userId: number;
    userType: string;
    documentId: string;
}) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/legalService/document/${documentId}`
        );
        const { data } = resp;
        return data;
    } catch {
        return false;
    }
};

export const fetchLegalDocuments = async ({
    userId,
    userType,
    limit,
    searchText,
    status,
    page,
}: {
    userId: number;
    userType: string;
    limit?: number;
    searchText?: string;
    status?: string;
    page?: number;
}): Promise<LegalDocumentsResponse | false> => {
    try {
        const params: Record<string, any> = {};
        if (limit) params.limit = limit;
        if (searchText) params.searchText = searchText;
        if (status && status !== 'All') params.status = status.toUpperCase();
        if (page) params.page = page;
        const resp: SuccessGenericResponse<LegalDocumentsResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/legalService/documents`,
            { params }
        );
        const { data } = resp;
        return data;
    } catch {
        return false;
    }
};

export const fetchLegalTemplates = async ({
    userId,
    userType,
    page = 1,
    itemsPerPage = 100,
    searchText = '',
    sort = 'ASC' as 'ASC' | 'DESC',
    sortField = 'title',
    category,
}: {
    userId: number;
    userType: string;
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    category?: string;
}) => {
    try {
        const params: Record<string, any> = { page, itemsPerPage, searchText, sort, sortField };
        if (category) params.category = category;
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/legalService/templates`,
            { params }
        );
        const { data } = resp;
        return data;
    } catch {
        return false;
    }
};
