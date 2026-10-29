import { useCallback, useEffect, useState } from 'react';

import {  useAppSelector } from '@src/hooks/store';

import { getDashboardData, getRefreshData } from '../api/index';

export default function useDashboard(isRefresh: boolean) {
    const { id, role } = useAppSelector(store => store.reducer.auth);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshLoading, setIsRefreshLoading] = useState(false);
    const [data, setData] = useState<any>();
    const [refresh, setRefresh] = useState<any>(false);
   

    const dashboardData = useCallback(async () => {
        const response: any | false = await getDashboardData({
            userId: id,
            userType: role,
        });

        if (response) {
            setData(response);
            setIsLoading(false);
        }
        setRefresh(false);
    }, [id, role]);

    const refreshData = useCallback(async () => {
        const response: any | false = await getRefreshData({
            userId: id,
            userType: role,
        });
        setIsRefreshLoading(true);

        if (response) {
            setRefresh(true);
            setData(response); // optionally remove if dashboardData will overwrite
            setIsRefreshLoading(false);

            // Fetch latest dashboard data again
            await dashboardData();

            return response;
        }
         setIsRefreshLoading(false);

        return false;
    }, [id, role, dashboardData]);

    useEffect(() => {
        if (isRefresh) {
            dashboardData();
        }
    }, [dashboardData, isRefresh, refresh]);

    return { data, isLoading, refreshData, setRefresh, isRefreshLoading };
}
