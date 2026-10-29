import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchDashboardData, getCachedDashboardData } from './useDashboardApi';

export function useSummaryStats() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const cached = getCachedDashboardData();

    const [totalSalary, setTotalSalary] = useState<number | undefined>(cached?.totalSalary);
    const [activeEmployees, setActiveEmployees] = useState<number | undefined>(
        cached?.activeEmployees
    );
    const [nextMonthSalary, setNextMonthSalary] = useState<number | undefined>(
        cached?.nextMonthSalary
    );
    const [isLoading, setIsLoading] = useState(!cached);

    const fetchStats = useCallback(async () => {
        const data = await fetchDashboardData(id, role);
        if (data) {
            setTotalSalary(data.totalSalary);
            setActiveEmployees(data.activeEmployees);
            setNextMonthSalary(data.nextMonthSalary);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { isLoading, totalSalary, activeEmployees, nextMonthSalary };
}
