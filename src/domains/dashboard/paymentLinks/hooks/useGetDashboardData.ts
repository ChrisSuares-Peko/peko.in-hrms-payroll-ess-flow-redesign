import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDashboardData } from '../api';
import { DashboardData } from '../types/paymentLinkTypes';

export default function useGetDashboardData() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        activePaymentLinksCount: 0,
        pendingPaymentLinksCount: 0,
        totalAmountThisMonth: 0,
        transactions: [],
    });
    const [isLoading, setIsLoading] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        const data = await getDashboardData({ userId: id, userType: role });
        setIsLoading(false);

        if (data) {
            setDashboardData(data);
        }
    }, [id, role]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        isLoading,
        activePaymentLinksCount: dashboardData.activePaymentLinksCount,
        pendingPaymentLinksCount: dashboardData.pendingPaymentLinksCount,
        totalAmountThisMonth: dashboardData.totalAmountThisMonth,
        transactions: dashboardData.transactions,
        fetchDashboardData,
    };
}
