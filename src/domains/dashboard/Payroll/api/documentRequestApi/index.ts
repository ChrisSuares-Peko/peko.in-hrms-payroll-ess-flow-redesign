import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export type DocumentRequestStatus = 'pending' | 'in-progress' | 'completed' | 'rejected';

export interface DocumentRequestItem {
    id: string;
    documentType: string;
    purpose?: string;
    status: DocumentRequestStatus;
    remarks?: string;
    employee?: {
        id?: string;
        fullName?: string;
        employeeId?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface DocumentRequestsListResponse {
    records: DocumentRequestItem[];
    total: number;
    pendingCount: number;
    page: number;
    limit: number;
}

interface ListPayload {
    userType: string;
    userId: number;
    page: number;
    limit: number;
    status?: string;
    searchText?: string;
}

interface UploadPayload {
    userType: string;
    userId: number;
    requestId: string;
    document: { base64: string; format: string } | string;
    note?: string;
}

const base = (userType: string, userId: number) => `/${userType}/${userId}/payroll/document-requests`;

export const getDocumentRequests = async (payload: ListPayload) => {
    try {
        const params = new URLSearchParams({
            page: String(payload.page),
            limit: String(payload.limit),
            ...(payload.status ? { status: payload.status } : {}),
            ...(payload.searchText ? { searchText: payload.searchText } : {}),
        });
        const resp: SuccessGenericResponse<DocumentRequestsListResponse> = await ApiClient.get(
            `${base(payload.userType, payload.userId)}?${params.toString()}`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const uploadDocumentRequest = async ({ userType, userId, requestId, document, note }: UploadPayload) => {
    try {
        const resp: SuccessGenericResponse<DocumentRequestItem> = await ApiClient.post(
            `${base(userType, userId)}/${requestId}/upload`,
            { document, note }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
