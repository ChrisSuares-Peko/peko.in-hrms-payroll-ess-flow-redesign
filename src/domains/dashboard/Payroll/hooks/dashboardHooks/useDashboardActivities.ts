import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchDashboardData, getCachedDashboardData } from './useDashboardApi';
import { activities } from '../../types/dashboardTypes';

export function useDashboardActivities() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const cached = getCachedDashboardData();

    const [activityList, setActivityList] = useState<activities[]>(
        cached?.upcomingActivities?.slice(0, 6) ?? []
    );
    const [isLoading, setIsLoading] = useState(!cached);

    const fetchActivities = useCallback(async () => {
        const data = await fetchDashboardData(id, role);
        if (data) {
            setActivityList((data.upcomingActivities as activities[]).slice(0, 6));
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    return { isLoading, activities: activityList };
}
