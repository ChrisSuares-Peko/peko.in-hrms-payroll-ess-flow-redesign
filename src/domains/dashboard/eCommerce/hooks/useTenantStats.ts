import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTenantStats } from '../api/tenantApi';
import { TenantStatsResponse } from '../types/tenant';

export function useTenantStats() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [stats, setStats] = useState<TenantStatsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        const resp = await getTenantStats({ userId: id, userType: role });
        if (resp !== false) {
            setStats(resp);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        tenant: stats?.tenant ?? null,
        subscription: stats?.subscription ?? null,
        orders: stats?.orders ?? null,
        products: stats?.products ?? null,
        customers: stats?.customers ?? null,
        isLoading,
        refetch: fetchStats,
    };
}
