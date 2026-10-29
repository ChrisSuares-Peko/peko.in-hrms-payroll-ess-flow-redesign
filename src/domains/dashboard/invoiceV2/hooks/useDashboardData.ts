import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllInvoices, getDashboardStats } from '../api/invoices';
import { DashboardStats } from '../types/dashboard';
import { InvoiceRow } from '../types/invoice';

const useDashboardData = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [recentInvoices, setRecentInvoices] = useState<InvoiceRow[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [isRecentInvoicesLoading, setIsRecentInvoicesLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setIsStatsLoading(true);
        const resp = await getDashboardStats({ userId: id, userType: role });
        if (resp && resp.status) {
            setStats(resp.data);
        }
        setIsStatsLoading(false);
    }, [id, role]);

    const fetchRecentInvoices = useCallback(async () => {
        setIsRecentInvoicesLoading(true);
        const data = await getAllInvoices({
            userId: id,
            userType: role,
            itemsPerPage: 6,
            sort: 'DESC',
            sortField: 'createdAt',
            searchText: '',
            page: 1,
        });
        if (!data) {
            dispatch(
                showToast({
                    description: 'Something went wrong while fetching recent invoices.',
                    variant: 'error',
                })
            );
        } else {
            setRecentInvoices(data.invoiceData);
        }
        setIsRecentInvoicesLoading(false);
    }, [dispatch, id, role]);

    useEffect(() => {
        fetchStats();
        fetchRecentInvoices();
    }, [fetchStats, fetchRecentInvoices]);

    return {
        stats,
        recentInvoices,
        isStatsLoading,
        isRecentInvoicesLoading,
        refreshStats: fetchStats,
        refreshRecentInvoices: fetchRecentInvoices,
    };
};

export default useDashboardData;
