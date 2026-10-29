import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAccountingDashboard } from '../api/dashboard';
import { AccountingDashboardData } from '../types/dashboard';

export default function useAccountingDashboard() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<AccountingDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const load = useCallback(
        async (refresh: boolean) => {
            if (refresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            const result = await getAccountingDashboard({ userId: id, userType: role, refresh });
            if (result) {
                setData(result);
            } else if (refresh) {
                dispatch(
                    showToast({
                        description:
                            'Could not refresh the dashboard. Showing the last loaded numbers.',
                        variant: 'error',
                    })
                );
            }
            setIsLoading(false);
            setIsRefreshing(false);
        },
        [dispatch, id, role]
    );

    useEffect(() => {
        load(false);
    }, [load]);

    const refresh = useCallback(() => load(true), [load]);
    const retry = useCallback(() => load(false), [load]);

    return { data, isLoading, isRefreshing, refresh, retry };
}
