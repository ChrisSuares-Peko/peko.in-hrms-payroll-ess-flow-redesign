import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { SERVER_URL } from '@src/config-global';
import { ApiClient } from '@src/services/config';
import { store } from '@store/store';
import type { RootState } from '@store/store';

import {
    BillerRecord,
    BillersListResponse,
    BillerTableParams,
    RefreshBillersResponse,
    RefreshProgressEvent,
    BillerPreviewResponse,
    AddBillerPayload,
    AddBillerResponse,
    RemoveBillerPayload,
    DisableBillerPayload,
    EnableBillerPayload,
    PreviewExcelPayload,
    PreviewJsonPayload,
    BulkUploadPayload,
    BulkRemovePayload,
    ApiResponse,
    FetchBillerMDMPayload,
    FetchBillerMDMResponse,
    RefreshMDMPayload,
    BillAvenueWallet,
    UpdateBillAvenueWalletPayload,
} from '../types/billers';

export const getAllBillers = async (
    payload: UserPayload & BillerTableParams
): Promise<BillersListResponse | false> => {
    const { userType, userId, page, pageSize, sortField, sortOrder, status, category, search, hasMDMData } = payload;
    const params = new URLSearchParams();
    params.append('page', String(page ?? 1));
    params.append('pageSize', String(pageSize ?? 10));
    if (sortField) params.append('sortField', sortField);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (hasMDMData !== undefined && hasMDMData !== '') params.append('hasMDMData', hasMDMData);

    const resp: SuccessGenericResponse<BillersListResponse> = await ApiClient.get(
        `${userType}/${userId}/payment/billers?${params.toString()}`
    );
    const { data } = resp;
    return data;
};

export const getBillAvenueWalletBalance = async (
    payload: UserPayload
): Promise<BillAvenueWallet | false> => {
    const resp: SuccessGenericResponse<BillAvenueWallet> = await ApiClient.get(
        `${payload.userType}/${payload.userId}/payment/billers/billavenue-wallet`
    );
    return resp.data;
};

export const updateBillAvenueWalletBalance = async (
    payload: UserPayload & UpdateBillAvenueWalletPayload
): Promise<BillAvenueWallet> => {
    const resp: SuccessGenericResponse<BillAvenueWallet> = await ApiClient.post(
        `${payload.userType}/${payload.userId}/payment/billers/billavenue-wallet`,
        { balance: payload.balance, threshold: payload.threshold }
    );
    if (!resp.status) throw new Error(resp.message);
    return resp.data;
};

export const addBiller = async (
    payload: UserPayload & AddBillerPayload
): Promise<AddBillerResponse | false> => {
    const resp: SuccessGenericResponse<AddBillerResponse> = await ApiClient.post(
        `${payload.userType}/${payload.userId}/payment/billers`,
        {
            billerId: payload.billerId,
            billerName: payload.billerName,
            billerCategory: payload.billerCategory,
            billerCoverage: payload.billerCoverage,
        }
    );
    if (!resp.status) throw new Error(resp.message);
    return resp.data;
};

export const updateBillerName = async (
    payload: UserPayload & { billerId: string; billerName: string }
): Promise<BillerRecord | false> => {
    const resp: SuccessGenericResponse<BillerRecord> = await ApiClient.patch(
        `${payload.userType}/${payload.userId}/payment/billers/${payload.billerId}/name`,
        { billerName: payload.billerName }
    );
    if (!resp.status) throw new Error(resp.message);
    return resp.data;
};

export const removeBiller = async (
    payload: UserPayload & RemoveBillerPayload
): Promise<ApiResponse<null> | false> => {
    const resp: SuccessGenericResponse<ApiResponse<null>> = await ApiClient.delete(
        `${payload.userType}/${payload.userId}/payment/billers/bulk-remove`,
        { data: { billerIds: payload.billerIds } }
    );
    const { data } = resp;
    return data;
};

export const disableBiller = async (
    payload: UserPayload & DisableBillerPayload
): Promise<ApiResponse<null> | false> => {
    const resp: SuccessGenericResponse<ApiResponse<null>> = await ApiClient.post(
        `${payload.userType}/${payload.userId}/payment/billers/disable`,
        { billerIds: payload.billerIds }
    );
    const { data } = resp;
    return data;
};

export const enableBiller = async (
    payload: UserPayload & EnableBillerPayload
): Promise<ApiResponse<null> | false> => {
    const resp: SuccessGenericResponse<ApiResponse<null>> = await ApiClient.post(
        `${payload.userType}/${payload.userId}/payment/billers/enable`,
        { billerIds: payload.billerIds }
    );
    const { data } = resp;
    return data;
};

export const previewBillersFromExcel = async (
    payload: PreviewExcelPayload
): Promise<BillerPreviewResponse | false> => {
    const formData = new FormData();
    formData.append('file', payload.file, payload.file.name);
    const resp: SuccessGenericResponse<BillerPreviewResponse> = await ApiClient.post(
        `${payload.userType}/${payload.userId}/payment/billers/preview`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    const { data } = resp;
    return data;
};

export const previewBillersFromJson = async (
    payload: PreviewJsonPayload
): Promise<BillerPreviewResponse | false> => {
    const resp: SuccessGenericResponse<BillerPreviewResponse> = await ApiClient.post(
        `${payload.userType}/${payload.userId}/payment/billers/preview-json`,
        { billersJsonData: payload.billersJsonData }
    );
    const { data } = resp;
    return data;
};

export const bulkUploadBillers = async (
    payload: BulkUploadPayload
): Promise<ApiResponse<null> | false> => {
    const resp: SuccessGenericResponse<ApiResponse<null>> = await ApiClient.post(
        `${payload.userType}/${payload.userId}/payment/billers/bulk-upload`,
        { selectedBillers: payload.selectedBillers }
    );
    const { data } = resp;
    return data;
};

export const fetchBillerMDM = async (
    payload: FetchBillerMDMPayload
): Promise<FetchBillerMDMResponse | false> => {
    const resp: SuccessGenericResponse<FetchBillerMDMResponse> = await ApiClient.post(
        `${payload.userType}/${payload.userId}/payment/billers/mdm/fetch`,
        { mode: payload.mode, category: payload.category, billerIds: payload.billerIds }
    );
    const { data } = resp;
    return data;
};

export const getBillerCategories = async (
    payload: { userType: string; userId: string }
): Promise<{ categories: string[] } | false> => {
    const resp: SuccessGenericResponse<{ categories: string[] }> = await ApiClient.get(
        `${payload.userType}/${payload.userId}/payment/billers/mdm/categories`
    );
    const { data } = resp;
    return data;
};

export const exportBillFetchLogs = async (
    payload: UserPayload & { fromDate: string; toDate: string }
): Promise<CommonFileBuffer | false> => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment/billers/fetch-logs/export`,
            { params: { fromDate: payload.fromDate, toDate: payload.toDate } }
        );
        const { data } = resp;
        return data;
    } catch {
        return false;
    }
};

export const bulkRemoveBillers = async (
    payload: BulkRemovePayload
): Promise<ApiResponse<null> | false> => {
    const resp: SuccessGenericResponse<ApiResponse<null>> = await ApiClient.delete(
        `${payload.userType}/${payload.userId}/payment/billers/bulk-remove`,
        { data: { billerIds: payload.billerIds } }
    );
    const { data } = resp;
    return data;
};

/**
 * Streams SSE batch progress events from the refresh endpoint.
 * Calls onProgress after each batch; resolves with final stats when done.
 */
export const refreshBillersStream = async (
    payload: RefreshMDMPayload,
    onProgress: (data: RefreshProgressEvent) => void,
    signal?: AbortSignal
): Promise<RefreshBillersResponse | false> => {
    const { userType, userId, mode, category, billerIds } = payload;
    // Read auth from store at call time (same as ApiClient interceptor) — avoids stale closure
    const { token, sessionId } = (store.getState() as RootState).reducer.auth;

    const response = await fetch(
        `${SERVER_URL}/${userType}/${userId}/payment/billers/refresh`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'Authorization': `Bearer ${token}`,
                'sessionid': sessionId,
            },
            body: JSON.stringify({ mode, category, billerIds }),
            signal,
        }
    );

    if (!response.ok) {
        throw new Error(`Refresh request failed: ${response.status} ${response.statusText}`);
    }
    if (!response.body) return false;

    type SSEEvent = {
        type: string;
        batchNumber?: number;
        totalBatches?: number;
        totalFetched?: number;
        failedCount?: number;
        autoDisabledCount?: number;
        lastUpdated?: string;
        message?: string;
    };

    const parseParts = (parts: string[]): RefreshBillersResponse | null =>
        parts.reduce<RefreshBillersResponse | null>((found, part) => {
            if (found !== null) return found;
            const line = part.trim();
            if (!line.startsWith('data: ')) return null;
            const parsed = JSON.parse(line.slice(6)) as SSEEvent;
            if (parsed.type === 'progress') {
                onProgress(parsed as RefreshProgressEvent);
                return null;
            }
            if (parsed.type === 'done') {
                return {
                    totalFetched: parsed.totalFetched ?? 0,
                    failedCount: parsed.failedCount ?? 0,
                    autoDisabledCount: parsed.autoDisabledCount ?? 0,
                    lastUpdated: parsed.lastUpdated ?? new Date().toISOString(),
                };
            }
            if (parsed.type === 'error') {
                throw new Error(parsed.message || 'Refresh failed');
            }
            return null;
        }, null);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const readChunk = async (buf: string): Promise<RefreshBillersResponse | false> => {
        const result = await reader.read();
        if (result.done) return false;
        const newBuf = buf + decoder.decode(result.value, { stream: true });
        const parts = newBuf.split('\n\n');
        const remaining = parts.pop() ?? '';
        const doneResult = parseParts(parts);
        if (doneResult !== null) return doneResult;
        return readChunk(remaining);
    };

    try {
        return await readChunk('');
    } finally {
        reader.releaseLock();
    }
};
