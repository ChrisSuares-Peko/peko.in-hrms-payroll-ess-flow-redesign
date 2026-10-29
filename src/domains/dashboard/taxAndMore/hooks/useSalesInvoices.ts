import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    addSalesInvoices,
    deleteSalesInvoice,
    getSalesInvoices,
    syncSalesInvoicesFromPeko,
    updateSalesInvoice,
} from '../api/tax';
import {
    AddSalesInvoicesPayload,
    MonthSummaryItem,
    SalesInvoiceRow,
    UpdateSalesInvoicePayload,
} from '../types';

const useSalesInvoices = (gstin: string, financialYear: string, month?: number) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [invoices, setInvoices] = useState<SalesInvoiceRow[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [monthSummary, setMonthSummary] = useState<MonthSummaryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMutating, setIsMutating] = useState(false);

    const fetchInvoices = useCallback(async () => {
        if (!gstin || !financialYear) return;
        setIsLoading(true);
        const data = await getSalesInvoices({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            ...(month ? { month } : {}),
        });
        if (data) {
            setInvoices(data.invoices.rows);
            setTotalCount(data.invoices.count);
            setMonthSummary(data.monthSummary);
        }
        setIsLoading(false);
    }, [id, role, gstin, financialYear, month]);

    const add = useCallback(
        async (payload: Omit<AddSalesInvoicesPayload, 'gstin' | 'financialYear'>) => {
            setIsMutating(true);
            const resp = await addSalesInvoices({
                userId: id,
                userType: role,
                gstin,
                financialYear,
                ...payload,
            });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Invoice added successfully', variant: 'success' })
                );
                await fetchInvoices();
                setIsMutating(false);
                return true;
            }
            setIsMutating(false);
            return false;
        },
        [id, role, gstin, financialYear, dispatch, fetchInvoices]
    );

    const update = useCallback(
        async (invoiceId: string, data: UpdateSalesInvoicePayload) => {
            setIsMutating(true);
            const resp = await updateSalesInvoice({
                userId: id,
                userType: role,
                id: invoiceId,
                ...data,
            });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Invoice updated successfully', variant: 'success' })
                );
                await fetchInvoices();
                setIsMutating(false);
                return true;
            }
            setIsMutating(false);
            return false;
        },
        [id, role, dispatch, fetchInvoices]
    );

    const remove = useCallback(
        async (invoiceId: string) => {
            setIsMutating(true);
            const resp = await deleteSalesInvoice({ userId: id, userType: role, id: invoiceId });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Invoice deleted successfully', variant: 'success' })
                );
                await fetchInvoices();
                setIsMutating(false);
                return true;
            }
            setIsMutating(false);
            return false;
        },
        [id, role, dispatch, fetchInvoices]
    );

    const sync = useCallback(async () => {
        if (!gstin || !financialYear || !month) return false;
        setIsMutating(true);
        const resp = await syncSalesInvoicesFromPeko({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        if (resp && resp.status) {
            const { synced, updated, added } = (resp as any).data ?? {};
            const syncedCount = synced ?? added ?? 0;
            const hasChanges = syncedCount > 0 || (updated ?? 0) > 0;
            dispatch(
                showToast({
                    description: hasChanges
                        ? 'Invoice data resynced successfully from Peko Invoicing.'
                        : 'No new invoices found in Peko for this month',
                    variant: hasChanges ? 'success' : 'info',
                })
            );
            await fetchInvoices();
            setIsMutating(false);
            return true;
        }
        dispatch(showToast({ description: 'Sync failed. Please try again.', variant: 'error' }));
        setIsMutating(false);
        return false;
    }, [id, role, gstin, financialYear, month, dispatch, fetchInvoices]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    return {
        invoices,
        totalCount,
        monthSummary,
        isLoading,
        isMutating,
        add,
        update,
        remove,
        sync,
        refresh: fetchInvoices,
    };
};

export default useSalesInvoices;
