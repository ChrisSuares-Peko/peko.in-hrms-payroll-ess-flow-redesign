import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    COMPLIANCE_TYPE_MAP,
    ComplianceDetailApiPayload,
    ComplianceDetailApiResponse,
    ComplianceDashboardSummary,
    ComplianceListApiPayload,
    ComplianceListApiResponse,
    ComplianceSubmitPayload,
} from '../types';

export const getComplianceListApi = async (payload: UserPayload & ComplianceListApiPayload) => {
    try {
        const resp: SuccessGenericResponse<ComplianceListApiResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/compliance/find-all`,
            {
                params: {
                    searchText: payload.searchText,
                    page: payload.page,
                    pageSize: payload.pageSize,
                    from: payload.from,
                    to: payload.to,
                    status: payload.status,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const submitComplianceApi = async (
    payload: UserPayload & ComplianceSubmitPayload
): Promise<{ complianceId: string; id: number } | false> => {
    try {
        const backendType = COMPLIANCE_TYPE_MAP[payload.complianceType] ?? payload.complianceType;
        const resp: SuccessGenericResponse<{ complianceId: string; id: number }> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/compliance`,
            {
                title: payload.title,
                complianceType: backendType,
                category: payload.category,
                section: payload.section,
                dueDate: payload.dueDate,
                formData: payload.formData,
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export interface SubmitDocumentItem {
    key: string;
    name: string;
    base64: string;
    mimeType: string;
}

export const fetchDocumentAsBase64 = async (
    payload: UserPayload & { url: string }
): Promise<{ base64: string; mimeType: string } | null> => {
    try {
        const { token, sessionId } = (await import('@store/store')).store.getState().reducer.auth;
        const { SERVER_URL } = await import('@src/config-global');
        const endpoint = `${SERVER_URL}/${payload.userType}/${payload.userId}/officeAndBusiness/compliance/document/download`;
        const resp = await fetch(`${endpoint}?url=${encodeURIComponent(payload.url)}`, {
            headers: { Authorization: `Bearer ${token}`, sessionid: sessionId },
        });
        if (!resp.ok) return null;
        const blob = await resp.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const base64 = dataUrl.split(',')[1];
                const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
                let mimeType = blob.type;
                if (!allowed.includes(mimeType)) {
                    const ext = payload.url.split('?')[0].split('.').pop()?.toLowerCase();
                    const extMap: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
                    mimeType = extMap[ext ?? ''] ?? 'application/pdf';
                }
                resolve({ base64, mimeType });
            };
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
};

export const submitDocumentsApi = async (
    payload: UserPayload & { complianceId: string; documents: SubmitDocumentItem[]; notes?: string; formData?: Record<string, unknown> }
): Promise<boolean> => {
    try {
        await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/compliance/${encodeURIComponent(payload.complianceId)}/submit-documents`,
            {
                documents: payload.documents,
                notes: payload.notes ?? '',
                ...(payload.formData ? { formData: payload.formData } : {}),
            }
        );
        return true;
    } catch {
        return false;
    }
};

export const downloadComplianceDocumentApi = async (
    payload: UserPayload & { url: string; name: string }
): Promise<void> => {
    try {
        const { token, sessionId } = (await import('@store/store')).store.getState().reducer.auth;
        const { SERVER_URL } = await import('@src/config-global');
        const endpoint = `${SERVER_URL}/${payload.userType}/${payload.userId}/officeAndBusiness/compliance/document/download`;
        const resp = await fetch(`${endpoint}?url=${encodeURIComponent(payload.url)}`, {
            headers: { Authorization: `Bearer ${token}`, sessionid: sessionId },
        });
        if (!resp.ok) throw new Error('download failed');
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = payload.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch {
        window.open(payload.url, '_blank');
    }
};

export const getComplianceDashboardSummaryApi = async (
    payload: UserPayload
): Promise<ComplianceDashboardSummary | false> => {
    try {
        const resp: SuccessGenericResponse<ComplianceDashboardSummary> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/compliance/dashboard/summary`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getComplianceDetailApi = async (
    payload: UserPayload & ComplianceDetailApiPayload
) => {
    try {
        const resp: SuccessGenericResponse<ComplianceDetailApiResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/compliance/find`,
            {
                params: { id: payload.id },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
