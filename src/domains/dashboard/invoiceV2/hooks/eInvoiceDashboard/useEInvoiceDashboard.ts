import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEInvoiceDashboardApi } from '../../api/eInvoice';
import { EInvoiceDashboardStats } from '../../types/eInvoice';
import { formatCompactAmount } from '../../utils/helperFunctions';

const defaultStats: EInvoiceDashboardStats = {
    totalIrns: 0,
    activeIrns: 0,
    activeValueLabel: '',
    cancelled: 0,
    eWaybills: 0,
};

const useEInvoiceDashboard = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [stats, setStats] = useState<EInvoiceDashboardStats>(defaultStats);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboard = useCallback(async () => {
        setIsLoading(true);
        const data = await getEInvoiceDashboardApi({ userId: id, userType: role });
        setIsLoading(false);
        if (!data) return;
        setStats({
            totalIrns: data.totalCount,
            activeIrns: data.activeCount,
            activeValueLabel: `${formatCompactAmount(data.activeTotalAmount)} value`,
            cancelled: data.cancelledLast30,
            eWaybills: data.eWaybillActiveCount,
        });
    }, [id, role]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return { stats, isLoading };
};

export default useEInvoiceDashboard;
