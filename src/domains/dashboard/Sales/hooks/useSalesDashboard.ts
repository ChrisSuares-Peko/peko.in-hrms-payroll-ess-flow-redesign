import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getRecentTransactions, getSalesDashboard } from '../api/dashboard';
import { getPaymentOnboardingStatus } from '../api/onboarding';
import { RecentTransactionItem, SalesDashboardData } from '../types/dashboard';
import { VirtualAccountResponse } from '../types/onboarding';

const useSalesDashboard = () => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<SalesDashboardData | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<RecentTransactionItem[]>([]);
    const [recentTransactionsTotal, setRecentTransactionsTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [onboardingRecord, setOnboardingRecord] = useState<VirtualAccountResponse | null>(null);

    const fetchDashboard = useCallback(async () => {
        setIsLoading(true);
        const [dashboardResp, transactionsResp, onboardingResp] = await Promise.all([
            getSalesDashboard({ userId, userType }),
            getRecentTransactions({ userId, userType, page: 1, itemsPerPage: 5 }),
            getPaymentOnboardingStatus({ userId, userType }),
        ]);
        if (dashboardResp) setData(dashboardResp);
        if (transactionsResp) {
            setRecentTransactions(transactionsResp.recentTransactions);
            setRecentTransactionsTotal(transactionsResp.recordsTotal);
        }
        // Onboarded only when the NuPay record is active (not merely activatedAt — a Decentro→NuPay
        // merchant keeps a stale activatedAt while status is still approval-pending). Otherwise the
        // activate banner stays until NuPay onboarding truly completes.
        const activated = !!(
            onboardingResp &&
            onboardingResp.status &&
            onboardingResp.data?.status === 'active' &&
            onboardingResp.data?.vendor === 'nupay'
        );
        setIsOnboarded(activated);
        setOnboardingRecord(onboardingResp && onboardingResp.status ? (onboardingResp.data ?? null) : null);
        setIsLoading(false);
    }, [userId, userType]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return {
        data,
        recentTransactions,
        recentTransactionsTotal,
        isLoading,
        isOnboarded,
        onboardingRecord,
        refresh: fetchDashboard,
    };
};

export default useSalesDashboard;
