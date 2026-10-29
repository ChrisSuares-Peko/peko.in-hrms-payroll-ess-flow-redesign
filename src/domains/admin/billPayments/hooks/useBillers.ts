import { useCallback, useEffect, useRef, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getAllBillers,
    addBiller,
    removeBiller,
    disableBiller,
    enableBiller,
    refreshBillersStream,
    bulkUploadBillers,
    getBillerCategories,
    updateBillerName,
    exportBillFetchLogs,
} from '../api/billers';
import {
    BillersListResponse,
    BillerTableParams,
    AddBillerPayload,
    BulkUploadPayloadForHook,
    FetchMDMMode,
    RefreshProgressEvent,
} from '../types/billers';

export const useBillers = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [data, setData] = useState<BillersListResponse | null>(null);
    const [fetchError, setFetchError] = useState(false);
    const [refreshProgress, setRefreshProgress] = useState<RefreshProgressEvent | null>(null);
    const [categories, setCategories] = useState<string[]>([]);

    // Always holds the latest table params so mutations can refetch the current view
    const tableParamsRef = useRef<BillerTableParams>({ page: 1, pageSize: 10 });

    const fetchBillers = useCallback(async (params?: BillerTableParams) => {
        const p = params ?? tableParamsRef.current;
        tableParamsRef.current = p;
        setIsLoading(true);
        setFetchError(false);
        try {
            const response = await getAllBillers({ userId: id, userType: role, ...p });
            if (response) {
                setData(response);
            } else {
                setFetchError(true);
            }
        } catch {
            setFetchError(true);
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    const handleTableChange = useCallback((params: BillerTableParams) => {
        fetchBillers(params);
    }, [fetchBillers]);

    const handleAddBiller = useCallback(async (payload: AddBillerPayload) => {
        setIsLoading(true);
        try {
            const response = await addBiller({ userId: id, userType: role, ...payload });
            setIsLoading(false);
            if (response && response.billerId) {
                dispatch(showToast({
                    description: `Biller "${response.billerId}" added successfully`,
                    variant: 'success',
                }));
                fetchBillers();
                return true;
            }
            return false;
        } catch (err: any) {
            setIsLoading(false);
            const message = err?.response?.data?.message || err?.message || 'Failed to add biller. Please try again.';
            dispatch(showToast({ description: message, variant: 'error' }));
            return false;
        }
    }, [id, role, dispatch, fetchBillers]);

    const handleRemoveBiller = useCallback(async (billerIds: string[]) => {
        setIsLoading(true);
        try {
            const response = await removeBiller({ userId: id, userType: role, billerIds });
            setIsLoading(false);
            if (response) {
                const count = billerIds.length;
                dispatch(showToast({
                    description: count === 1 ? 'Biller removed successfully' : `${count} billers removed successfully`,
                    variant: 'success',
                }));
                fetchBillers();
                return true;
            }
            return false;
        } catch {
            setIsLoading(false);
            dispatch(showToast({ description: 'Failed to remove biller(s). Please try again.', variant: 'error' }));
            return false;
        }
    }, [id, role, dispatch, fetchBillers]);

    const handleDisableBiller = useCallback(async (billerIds: string[]) => {
        setIsLoading(true);
        try {
            const response = await disableBiller({ userId: id, userType: role, billerIds });
            setIsLoading(false);
            if (response) {
                const count = billerIds.length;
                dispatch(showToast({
                    description: count === 1 ? 'Biller disabled successfully' : `${count} billers disabled successfully`,
                    variant: 'success',
                }));
                fetchBillers();
                return true;
            }
            return false;
        } catch {
            setIsLoading(false);
            dispatch(showToast({ description: 'Failed to disable biller(s). Please try again.', variant: 'error' }));
            return false;
        }
    }, [id, role, dispatch, fetchBillers]);

    const handleEnableBiller = useCallback(async (billerIds: string[]) => {
        setIsLoading(true);
        try {
            const response = await enableBiller({ userId: id, userType: role, billerIds });
            setIsLoading(false);
            if (response) {
                const count = billerIds.length;
                dispatch(showToast({
                    description: count === 1 ? 'Biller enabled successfully' : `${count} billers enabled successfully`,
                    variant: 'success',
                }));
                fetchBillers();
                return true;
            }
            return false;
        } catch {
            setIsLoading(false);
            dispatch(showToast({ description: 'Failed to enable biller(s). Please try again.', variant: 'error' }));
            return false;
        }
    }, [id, role, dispatch, fetchBillers]);

    const handleBulkUpload = useCallback(async (payload: BulkUploadPayloadForHook) => {
        setIsLoading(true);
        try {
            const response = await bulkUploadBillers({ userId: id, userType: role, selectedBillers: payload.selectedBillers });
            setIsLoading(false);
            if (response) {
                dispatch(showToast({ description: response.message || 'Billers uploaded successfully', variant: 'success' }));
                fetchBillers();
                return true;
            }
            return false;
        } catch {
            setIsLoading(false);
            dispatch(showToast({ description: 'Failed to upload billers. Please try again.', variant: 'error' }));
            return false;
        }
    }, [id, role, dispatch, fetchBillers]);

    const handleUpdateBillerName = useCallback(async (billerId: string, billerName: string) => {
        setIsLoading(true);
        try {
            const response = await updateBillerName({ userId: id, userType: role, billerId, billerName });
            setIsLoading(false);
            if (response) {
                dispatch(showToast({ description: 'Biller name updated', variant: 'success' }));
                fetchBillers();
                return true;
            }
            return false;
        } catch (err: any) {
            setIsLoading(false);
            const message = err?.response?.data?.message || err?.message || 'Failed to update biller name';
            dispatch(showToast({ description: message, variant: 'error' }));
            return false;
        }
    }, [id, role, dispatch, fetchBillers]);

    const handleRefresh = useCallback(async (selectedIds?: string[]) => {
        const mode: FetchMDMMode | undefined = selectedIds && selectedIds.length > 0 ? 'selected' : undefined;
        const billerIds = mode === 'selected' ? selectedIds : undefined;
        setIsRefreshing(true);
        setRefreshProgress(null);
        try {
            const result = await refreshBillersStream(
                { userId: id, userType: role, mode, billerIds },
                (progress) => setRefreshProgress(progress),
            );
            setIsRefreshing(false);
            setRefreshProgress(null);
            if (result) {
                const parts: string[] = [`${result.totalFetched} updated`];
                if (result.autoDisabledCount > 0) parts.push(`${result.autoDisabledCount} disabled (not in BBPS)`);
                if (result.failedCount > 0) parts.push(`${result.failedCount} failed`);
                dispatch(showToast({ description: `MDM refresh complete: ${parts.join(', ')}`, variant: 'success' }));
                fetchBillers();
            }
        } catch {
            setIsRefreshing(false);
            setRefreshProgress(null);
            dispatch(showToast({ description: 'Failed to refresh biller MDM. Please try again.', variant: 'error' }));
        }
    }, [id, role, dispatch, fetchBillers]);

    const handleExportFetchLogs = useCallback(async (fromDate: string, toDate: string) => {
        setIsExporting(true);
        try {
            const fileData: CommonFileBuffer | false = await exportBillFetchLogs({ userId: id, userType: role, fromDate, toDate });
            if (fileData) {
                const blob = new Blob([new Uint8Array(fileData.buffer.data)], { type: fileData.fileType });
                saveAs(blob, 'Bill Fetch Report.xlsx');
            } else {
                dispatch(showToast({ description: 'No bill fetch records found for the selected dates.', variant: 'error' }));
            }
        } catch {
            dispatch(showToast({ description: 'Failed to download bill fetch report. Please try again.', variant: 'error' }));
        } finally {
            setIsExporting(false);
        }
    }, [id, role, dispatch]);

    useEffect(() => {
        fetchBillers();
    }, [fetchBillers]);

    useEffect(() => {
        getBillerCategories({ userId: String(id), userType: role }).then(res => {
            if (res) setCategories(res.categories);
        });
    }, [id, role]);

    return {
        isLoading,
        isRefreshing,
        isExporting,
        data,
        fetchError,
        categories,
        refreshProgress,
        retry: fetchBillers,
        handleAddBiller,
        handleRemoveBiller,
        handleDisableBiller,
        handleEnableBiller,
        handleBulkUpload,
        handleTableChange,
        handleRefresh,
        handleUpdateBillerName,
        handleExportFetchLogs,
    };
};
