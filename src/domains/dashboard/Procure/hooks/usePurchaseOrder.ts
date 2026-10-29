import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { VendorEmailError, addPurchaseOrderNote, cancelPurchaseOrder, createPurchaseOrder, deletePurchaseOrder, getPurchaseOrderById, getPurchaseOrderDocument, getPurchaseOrderJourney, getPurchaseOrderNotes, getPurchaseOrderPdf, getPurchaseOrders, getPurchaseOrdersDropdown, updatePurchaseOrder, updatePurchaseOrderStatus } from '../api';
import { CreatePurchaseOrderPayload, PurchaseOrderDetail, PurchaseOrderFilters } from '../types';

export function usePurchaseOrder(id?: string, filters?: PurchaseOrderFilters) {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading]               = useState(false);
    const [isSubmitting, setIsSubmitting]         = useState(false);
    const [isDownloading, setIsDownloading]       = useState(false);
    const [tableData, setTableData]               = useState<PurchaseOrderDetail[]>([]);
    const [count, setCount]                       = useState(0);
    const [detail, setDetail]                     = useState<PurchaseOrderDetail | null>(null);
    const [dropdownData, setDropdownData]         = useState<PurchaseOrderDetail[]>([]);
    const [vendorEmailError, setVendorEmailError] = useState<VendorEmailError | null>(null);

    const fetchPurchaseOrders = useCallback(async () => {
        if (!filters) return;
        setIsLoading(true);
        const data = await getPurchaseOrders({ corporateId: String(corporateId), ...filters });
        if (data) {
            setTableData(data.rows ?? []);
            setCount(data.count ?? 0);
        }
        setIsLoading(false);
    }, [filters, corporateId]);

    const fetchDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const data = await getPurchaseOrderById({ corporateId: String(corporateId), id });
        if (data) setDetail(data);
        setIsLoading(false);
    }, [corporateId, id]);

    useEffect(() => { fetchPurchaseOrders(); }, [fetchPurchaseOrders]);
    useEffect(() => { fetchDetail(); }, [fetchDetail]);

    const create = useCallback(async (payload: CreatePurchaseOrderPayload): Promise<PurchaseOrderDetail | false> => {
        setIsSubmitting(true);
        const result = await createPurchaseOrder({ corporateId: String(corporateId), payload });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to create purchase order. Please try again.' }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const update = useCallback(async (recordId: string | number, payload: CreatePurchaseOrderPayload): Promise<PurchaseOrderDetail | false> => {
        setIsSubmitting(true);
        const result = await updatePurchaseOrder({ corporateId: String(corporateId), id: recordId, payload });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to update purchase order. Please try again.' }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const updateStatus = useCallback(async (recordId: string | number, nextStatus: string): Promise<PurchaseOrderDetail | false> => {
        setIsSubmitting(true);
        const result = await updatePurchaseOrderStatus({ corporateId: String(corporateId), id: recordId, nextStatus });
        if (result && 'vendorEmailError' in result) {
            setVendorEmailError(result.vendorEmailError);
            setIsSubmitting(false);
            return false;
        }
        if (result && 'data' in result) {
            // status responses don't carry billing; it can't change on a status transition
            setDetail(prev => ({ ...result.data, billedAmount: prev?.billedAmount, billingState: prev?.billingState }));
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsSubmitting(false);
        return result && 'data' in result ? result.data : false;
    }, [corporateId, dispatch]);

    const remove = useCallback(async (recordId: string | number): Promise<boolean> => {
        setIsSubmitting(true);
        const ok = await deletePurchaseOrder({ corporateId: String(corporateId), id: recordId });
        if (ok) dispatch(showToast({ variant: 'success', description: 'Purchase order deleted successfully.' }));
        setIsSubmitting(false);
        return ok;
    }, [corporateId, dispatch]);

    const cancel = useCallback(async (recordId: string | number, reason: string): Promise<boolean> => {
        setIsSubmitting(true);
        const result = await cancelPurchaseOrder({ corporateId: String(corporateId), id: recordId, reason });
        setIsSubmitting(false);
        if (!result) return false;
        dispatch(showToast({ variant: 'success', description: result.message }));
        await fetchDetail();
        return true;
    }, [corporateId, dispatch, fetchDetail]);

    const fetchJourney = useCallback(async (recordId: string | number): Promise<any[]> => {
        const data = await getPurchaseOrderJourney({ corporateId: String(corporateId), id: recordId });
        return data || [];
    }, [corporateId]);

    const fetchNotes = useCallback(async (recordId: string | number): Promise<any[]> => {
        const data = await getPurchaseOrderNotes({ corporateId: String(corporateId), id: recordId });
        return data || [];
    }, [corporateId]);

    const addNote = useCallback(async (recordId: string | number, note: string): Promise<any> => {
        const result = await addPurchaseOrderNote({ corporateId: String(corporateId), id: recordId, note });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to add note. Please try again.' }));
        }
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const fetchDropdownData = useCallback(async () => {
        const data: any = await getPurchaseOrdersDropdown({ corporateId: String(corporateId), page: 1, limit: 1000 });
        if (data) {
            const rows: PurchaseOrderDetail[] = Array.isArray(data) ? data : (data.data ?? data.rows ?? []);
            setDropdownData(rows.filter(po => po.status !== 'Cancelled'));
        }
    }, [corporateId]);

    const fetchDocument = useCallback((recordId: string | number): Promise<any> =>
        getPurchaseOrderDocument({ corporateId: String(corporateId), id: recordId }),
    [corporateId]);

    const downloadPdf = useCallback(async (recordId: string | number): Promise<boolean> => {
        setIsDownloading(true);
        const blob = await getPurchaseOrderPdf({ corporateId: String(corporateId), id: recordId });
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = `PO-${recordId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to download PDF. Please try again.' }));
        }
        setIsDownloading(false);
        return !!blob;
    }, [corporateId, dispatch]);

    return { isLoading, isSubmitting, isDownloading, tableData, count, fetchPurchaseOrders, detail, fetchDetail, create, update, updateStatus, cancel, remove, downloadPdf, fetchDocument, fetchJourney, fetchNotes, addNote, dropdownData, fetchDropdownData, vendorEmailError, clearVendorEmailError: () => setVendorEmailError(null) };
}
