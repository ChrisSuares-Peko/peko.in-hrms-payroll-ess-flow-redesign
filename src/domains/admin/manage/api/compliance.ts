import { ApiClient } from '@src/services/config';

import {
    AdminComplianceListFilters,
    AdminComplianceListResponse,
    AdminComplianceRecord,
    AdminComplianceUpdatePayload,
} from '../types/compliance';

interface UserContext {
    userId: string | number;
    userType: string;
}

export const getAdminComplianceListApi = async (
    ctx: UserContext,
    filters: AdminComplianceListFilters
): Promise<AdminComplianceListResponse | false> => {
    try {
        const resp = await ApiClient.get(
            `${ctx.userType}/${ctx.userId}/officeAndBusiness/compliance/find-all`,
            {
                params: {
                    searchText: filters.searchText,
                    page: filters.page,
                    pageSize: filters.itemsPerPage,
                    status: filters.status || undefined,
                    sort: filters.sort,
                    sortField: filters.sortField || undefined,
                    from: filters.from,
                    to: filters.to,
                },
            }
        );
        return resp.data?.data ?? resp.data;
    } catch {
        return false;
    }
};

export const getAdminComplianceDetailApi = async (
    ctx: UserContext,
    id: number
): Promise<AdminComplianceRecord | false> => {
    try {
        const resp = await ApiClient.get(
            `${ctx.userType}/${ctx.userId}/officeAndBusiness/compliance/find`,
            {
                params: { id },
            }
        );
        return resp.data?.data ?? resp.data;
    } catch {
        return false;
    }
};

export interface AdminComplianceDocumentSigned {
    id: string;
    key: string;
    name: string;
    url: string;
    uploadedAt: string;
}

export const getAdminComplianceDocumentsApi = async (
    ctx: UserContext,
    complianceId: string
): Promise<AdminComplianceDocumentSigned[] | false> => {
    try {
        const resp = await ApiClient.get(
            `${ctx.userType}/${ctx.userId}/officeAndBusiness/compliance/${encodeURIComponent(complianceId)}/documents`
        );
        const raw = resp.data?.data ?? resp.data;
        return Array.isArray(raw) ? raw : (raw?.documents ?? raw?.rows ?? []);
    } catch {
        return false;
    }
};

const fetchComplianceBlob = async (
    ctx: UserContext,
    url: string,
    disposition: 'inline' | 'attachment'
): Promise<Blob | null> => {
    try {
        const { token, sessionId } = (await import('@store/store')).store.getState().reducer.auth;
        const { SERVER_URL } = await import('@src/config-global');
        const endpoint = `${SERVER_URL}/${ctx.userType}/${ctx.userId}/officeAndBusiness/compliance/document/download`;
        const resp = await fetch(
            `${endpoint}?url=${encodeURIComponent(url)}&disposition=${disposition}`,
            {
                headers: { Authorization: `Bearer ${token}`, sessionid: sessionId },
            }
        );
        if (!resp.ok) return null;
        return await resp.blob();
    } catch {
        return null;
    }
};

export const viewAdminComplianceDocumentApi = async (
    ctx: UserContext,
    url: string
): Promise<void> => {
    const blob = await fetchComplianceBlob(ctx, url, 'inline');
    if (!blob) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
    }
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
};

export const downloadAdminComplianceDocumentApi = async (
    ctx: UserContext,
    url: string,
    name: string
): Promise<void> => {
    const blob = await fetchComplianceBlob(ctx, url, 'attachment');
    if (!blob) {
        window.open(url, '_blank');
        return;
    }
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
};

export const updateAdminComplianceStatusApi = async (
    ctx: UserContext,
    payload: AdminComplianceUpdatePayload
): Promise<boolean> => {
    try {
        await ApiClient.patch(
            `${ctx.userType}/${ctx.userId}/officeAndBusiness/compliance/update-status`,
            payload
        );
        return true;
    } catch {
        return false;
    }
};
