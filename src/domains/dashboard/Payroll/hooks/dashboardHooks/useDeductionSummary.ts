import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchDashboardData, getCachedDashboardData } from './useDashboardApi';
import { dashboardResponse } from '../../types/dashboardTypes';

export function useDeductionSummary() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const cached = getCachedDashboardData();

    const [deductionSummaryData, setDeductionSummaryData] = useState<
        dashboardResponse['deductionSummary'] | undefined
    >(cached?.deductionSummary ?? undefined);
    const [isLoading, setIsLoading] = useState(!cached);

    const fetchDeductions = useCallback(async () => {
        const data = await fetchDashboardData(id, role);
        if (data) {
            setDeductionSummaryData(data.deductionSummary);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchDeductions();
    }, [fetchDeductions]);

    return { isLoading, deductionSummaryData };
}
