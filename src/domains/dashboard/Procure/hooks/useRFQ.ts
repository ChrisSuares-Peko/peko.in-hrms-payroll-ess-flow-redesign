import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { VendorEmailError, closeRFQ, createRFQ, deleteRFQAttachment, getRFQById, getRFQs, reopenRFQ, saveDraftRFQ, saveExistingDraftRFQ, sendReminders, updateRFQ } from '../api';
import { CreateRFQPayload, RFQDetail, RFQFilters, UpdateRFQPayload } from '../types';

export function useRFQ(id?: string, filters?: RFQFilters) {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading]               = useState(false);
    const [isSubmitting, setIsSubmitting]         = useState(false);
    const [tableData, setTableData]               = useState<RFQDetail[]>([]);
    const [count, setCount]                       = useState(0);
    const [detail, setDetail]                     = useState<RFQDetail | null>(null);
    const [vendorEmailError, setVendorEmailError] = useState<VendorEmailError | null>(null);

    const fetchRFQs = useCallback(async () => {
        if (!filters) return;
        setIsLoading(true);
        const data = await getRFQs({ corporateId: String(corporateId), ...filters });
        if (data) {
            setTableData(data.rows ?? []);
            setCount(data.count ?? 0);
        }
        setIsLoading(false);
    }, [filters, corporateId]);

    const fetchDetail = useCallback(async (silent = false) => {
        if (!id) return;
        if (!silent) setIsLoading(true);
        const data = await getRFQById({ corporateId: String(corporateId), id });
        if (data) setDetail(data);
        if (!silent) setIsLoading(false);
    }, [corporateId, id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const saveDraft = useCallback(async (payload: Partial<Omit<CreateRFQPayload, 'send'>>): Promise<RFQDetail | false> => {
        setIsSubmitting(true);
        const result = await saveDraftRFQ({ corporateId: String(corporateId), payload });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const create = useCallback(async (payload: CreateRFQPayload): Promise<RFQDetail | false> => {
        setIsSubmitting(true);
        const result = await createRFQ({ corporateId: String(corporateId), payload });
        if (result && 'vendorEmailError' in result) {
            setVendorEmailError(result.vendorEmailError);
            setIsSubmitting(false);
            return false;
        }
        if (result && 'data' in result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsSubmitting(false);
        return result && 'data' in result ? result.data : false;
    }, [corporateId, dispatch]);

    const close = useCallback(async (rfqId: string | number): Promise<RFQDetail | false> => {
        setIsSubmitting(true);
        const result = await closeRFQ({ corporateId: String(corporateId), id: rfqId });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const reopen = useCallback(async (rfqId: string | number): Promise<RFQDetail | false> => {
        setIsSubmitting(true);
        const result = await reopenRFQ({ corporateId: String(corporateId), id: rfqId });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const update = useCallback(async (rfqId: string | number, payload: UpdateRFQPayload): Promise<RFQDetail | false> => {
        setIsSubmitting(true);
        const result = await updateRFQ({ corporateId: String(corporateId), id: rfqId, payload });
        if (result && 'vendorEmailError' in result) {
            setVendorEmailError(result.vendorEmailError);
            setIsSubmitting(false);
            return false;
        }
        if (result && 'data' in result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsSubmitting(false);
        return result && 'data' in result ? result.data : false;
    }, [corporateId, dispatch]);

    const saveExistingDraft = useCallback(async (rfqId: string | number, payload: Partial<UpdateRFQPayload>): Promise<RFQDetail | false> => {
        setIsSubmitting(true);
        const result = await saveExistingDraftRFQ({ corporateId: String(corporateId), id: rfqId, payload });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const deleteAttachment = useCallback(async (rfqId: string | number, fileName: string): Promise<boolean> => {
        const result = await deleteRFQAttachment({ corporateId: String(corporateId), id: rfqId, fileName });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
            setDetail(prev => prev ? { ...prev, attachments: result.data.attachments } : prev);
        }
        return !!result;
    }, [corporateId, dispatch]);

    const sendReminder = useCallback(async (rfqId: string | number, email?: string): Promise<boolean> => {
        setIsSubmitting(true);
        const invitedEmails = email ? [email] : [];
        const result = await sendReminders({ corporateId: String(corporateId), id: rfqId, invitedEmails });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
            await fetchDetail(true);
        }
        setIsSubmitting(false);
        return !!result;
    }, [corporateId, dispatch, fetchDetail]);

    return { isLoading, isSubmitting, tableData, count, fetchRFQs, detail, fetchDetail, create, saveDraft, update, saveExistingDraft, close, reopen, sendReminder, deleteAttachment, vendorEmailError, clearVendorEmailError: () => setVendorEmailError(null) };
}
