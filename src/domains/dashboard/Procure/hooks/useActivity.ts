import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { ActivityFilters, getActivityData } from '../api';
import { DashboardActivity } from '../types';

export function useActivity(filters: ActivityFilters & { page: number; limit: number }) {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [activity, setActivity] = useState<DashboardActivity[]>([]);
    const [total, setTotal] = useState(0);

    const fetchActivity = useCallback(async () => {
        setIsLoading(true);
        const result = await getActivityData({ corporateId: String(corporateId), ...filters });
        if (result) {
            setActivity(result.data);
            setTotal(result.total);
        }
        setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [corporateId, JSON.stringify(filters)]);

    useEffect(() => { fetchActivity(); }, [fetchActivity]);

    return { isLoading, activity, total, fetchActivity };
}
