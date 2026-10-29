import { useState, useEffect, useCallback } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllInvoices, deleteInvoiceApi, getDashboardStats, markInvoiceAsPaid } from '../api/invoices';
import { DashboardStats } from '../types/dashboard';
import { GetAllInvoicesPayload, GetAllInvoicesResponse, InvoiceRow } from '../types/invoice';

const useInvoice = (filters: GetAllInvoicesPayload) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [invoiceList, setInvoiceList] = useState<GetAllInvoicesResponse>();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);

    const fetchStats = useCallback(async () => {
        setIsStatsLoading(true);
        const resp = await getDashboardStats({ userId: id, userType: role });
        if (resp && resp.status) {
            setStats(resp.data);
        }
        setIsStatsLoading(false);
    }, [id, role]);

    const fetchInvoiceList = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllInvoices({ userId: id, userType: role, ...filters });
        if (!data) {
            dispatch(
                showToast({
                    description: 'Something went wrong while fetching invoices.',
                    variant: 'error',
                })
            );
        } else {
            setInvoiceList(data);
        }
        setIsLoading(false);
    }, [dispatch, id, role, filters]);

    const deleteInvoice = useCallback(
        async (invoiceId: string) => {
            setIsDeleting(true);
            const resp = await deleteInvoiceApi({ userId: id, userType: role, invoiceId });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Invoice deleted successfully', variant: 'success' })
                );
                fetchInvoiceList();
                fetchStats();
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsDeleting(false);
        },
        [dispatch, fetchInvoiceList, fetchStats, id, role]
    );

    const markAsPaid = useCallback(
        async (invoiceId: string) => {
            setIsMarkingPaid(true);
            const success = await markInvoiceAsPaid({ userId: id, userType: role, invoiceId });
            if (success) {
                dispatch(showToast({ description: 'Invoice marked as paid', variant: 'success' }));
                setInvoiceList(prev =>
                    prev
                        ? {
                              ...prev,
                              invoiceData: prev.invoiceData.map((inv: InvoiceRow) =>
                                  inv.id === invoiceId ? { ...inv, status: 'Paid' as InvoiceRow['status'] } : inv
                              ),
                          }
                        : prev
                );
                fetchStats();
            } else {
                dispatch(showToast({ description: 'Failed to mark invoice as paid', variant: 'error' }));
            }
            setIsMarkingPaid(false);
        },
        [dispatch, fetchStats, id, role]
    );

    useEffect(() => {
        fetchInvoiceList();
    }, [fetchInvoiceList]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { invoiceList, stats, isLoading, isStatsLoading, isDeleting, isMarkingPaid, deleteInvoice, markAsPaid };
};

export default useInvoice;
