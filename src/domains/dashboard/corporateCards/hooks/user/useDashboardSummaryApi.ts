import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { DashboardSummaryResponse, getDashboardSummary } from '../../api/user/dashboardApi';

/** Role-aware dashboard summary (KPIs + spend charts + card utilisation). Used by both dashboards. */
export const useDashboardSummaryApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            setIsLoading(true);
            const res = await getDashboardSummary(role, id);
            if (active && res && res.data) setSummary(res.data);
            if (active) setIsLoading(false);
        })();
        return () => {
            active = false;
        };
    }, [role, id]);

    return { summary, isLoading };
};
