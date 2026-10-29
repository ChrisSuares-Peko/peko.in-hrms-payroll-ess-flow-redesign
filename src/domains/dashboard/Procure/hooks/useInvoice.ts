import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createInvoice, createPaymentForInvoice, getInvoiceById, getInvoices, getOnboardingStatus, updateInvoice } from '../api';
import { CreateInvoicePayload, InvoiceData, InvoiceFilters } from '../types';

export function useInvoice(filters?: InvoiceFilters, id?: string) {
    const { corporateId, id: userId, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading]       = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tableData, setTableData]       = useState<InvoiceData[]>([]);
    const [total, setTotal]               = useState(0);
    const [detail, setDetail]             = useState<InvoiceData | null>(null);

    const fetchInvoices = useCallback(async () => {
        if (!filters) return;
        setIsLoading(true);
        const data = await getInvoices({ corporateId: String(corporateId), ...filters });
        if (data) {
            setTableData(data.data ?? []);
            setTotal(data.total ?? 0);
        }
        setIsLoading(false);
    }, [corporateId, filters]);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const fetchDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const data = await getInvoiceById({ corporateId: String(corporateId), id });
        if (data) setDetail(data);
        setIsLoading(false);
    }, [corporateId, id]);

    useEffect(() => { fetchDetail(); }, [fetchDetail]);

    const pay = async (invoiceId: string | number, transferType?: string): Promise<boolean> => {
        setIsSubmitting(true);
        const onboarding = await getOnboardingStatus({ userId, userType: role });
        const virtualAccountNumber = onboarding ? onboarding.virtualAccountNumber : undefined;
        const result = await createPaymentForInvoice({ corporateId: String(corporateId), id: invoiceId, transferType, virtualAccountNumber });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        // error toast is handled by the ApiClient response interceptor
        setIsSubmitting(false);
        return !!result;
    };

    const update = async (invoiceId: string | number, payload: Partial<CreateInvoicePayload>): Promise<InvoiceData | false> => {
        setIsSubmitting(true);
        const result = await updateInvoice({ corporateId: String(corporateId), id: invoiceId, payload });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to update invoice. Please try again.' }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    };

    const create = async (payload: CreateInvoicePayload): Promise<InvoiceData | false> => {
        setIsSubmitting(true);
        const result = await createInvoice({ corporateId: String(corporateId), payload });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to create invoice. Please try again.' }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    };

    return { isLoading, isSubmitting, tableData, total, fetchInvoices, detail, fetchDetail, create, update, pay };
}
