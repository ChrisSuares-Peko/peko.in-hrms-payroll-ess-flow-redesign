import { SuccessGenericResponse, UserPayload, CommonFileBuffer } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { CreateDocumentPayload, CustomerOption } from '../types/createDocument';
import { GetDocumentByIdResponse } from '../types/documentDetails';
import {
    DocumentType,
    GetAllDocumentsPayload,
    GetAllDocumentsResponse,
    InvoiceStats,
    QuotationStats,
    SalesOrderStats,
} from '../types/documents';

export const getNextDocumentNumberApi = async (
    payload: UserPayload & { documentType: DocumentType }
) => {
    try {
        const { userId, userType, documentType } = payload;
        const resp: SuccessGenericResponse<{ nextNumber: string }> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/next-number`,
            { params: { documentType } }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const getAllCustomersForSelect = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<CustomerOption[]> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/customers`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getAllDocuments = async (payload: UserPayload & GetAllDocumentsPayload) => {
    try {
        const { userId, userType, endDate, startDate, ...rest } = payload;
        const resp: SuccessGenericResponse<GetAllDocumentsResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/all`,
            {
                params: {
                    ...rest,
                    to: endDate,
                    from: startDate,
                },
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getDocumentById = async (payload: UserPayload & { documentId: string }) => {
    try {
        const { userId, userType, documentId } = payload;
        const resp: SuccessGenericResponse<GetDocumentByIdResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${documentId}`
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const createDocument = async (payload: UserPayload & CreateDocumentPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ id: string }> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const updateDocument = async (
    payload: UserPayload & CreateDocumentPayload & { documentId: string }
) => {
    try {
        const { userId, userType, documentId, ...body } = payload;
        const resp: SuccessGenericResponse<{ id: string }> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${documentId}`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const updateDocumentStatus = async (
    payload: UserPayload & { documentId: string; status: string }
) => {
    try {
        const { userId, userType, documentId, status } = payload;
        const resp: SuccessGenericResponse<{ invoiceId: number; status: string }> =
            await ApiClient.patch(
                `${userType}/${userId}/officeAndBusiness/invoicing/v2/${documentId}/status`,
                { status }
            );
        return resp;
    } catch {
        return false;
    }
};

export const sendDocumentEmail = async (
    payload: UserPayload & { documentId: string; email?: string }
) => {
    try {
        const { userId, userType, documentId, email } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${documentId}/send-email`,
            email ? { email } : undefined
        );
        return resp;
    } catch {
        return false;
    }
};

export const downloadDocumentPdfApi = async (
    payload: UserPayload & { documentId: string; type?: string }
) => {
    try {
        const { userId, userType, documentId, type } = payload;
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/downloadInvoice/${documentId}`,
            { params: type ? { type } : undefined }
        );
        return resp;
    } catch {
        return false;
    }
};

export const getInvoiceStats = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<InvoiceStats> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/dashboard`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const getSalesOrderStats = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<SalesOrderStats> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/sales-order/dashboard`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const getQuotationStats = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<QuotationStats> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/quotation/dashboard`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const deleteDocumentApi = async (payload: UserPayload & { documentId: string }) => {
    try {
        const { userId, userType, documentId } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${documentId}`
        );
        return resp;
    } catch {
        return false;
    }
};
