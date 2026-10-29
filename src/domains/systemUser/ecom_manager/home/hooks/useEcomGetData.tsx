import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDashboardData } from '../api/index';
import { dashboardStatusData } from '../types/types';

const useEcomGetData = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<dashboardStatusData>({
        CANCELLED: 0,
        COMPLETE: 0,
        COMPLETED: 0,
        CONFIRMED: 0,
        DELIVERED: 0,
        ONPROGRESS: 0,
        PENDING: 0,
        REFUNDED: 0,
        SHIPPED: 0,
        TOTAL: 0,
        PRODUCTSCOUNT: 0,
    });

    const getData = useCallback(async () => {
        const data: dashboardStatusData | false = await getDashboardData({
            userId: id,
            userType: role,
        });

        if (data) {
            const updatedData: dashboardStatusData = {} as dashboardStatusData;
            const keys = Object.keys(data) as (keyof dashboardStatusData)[];
            keys.forEach(key => {
                updatedData[key] = data[key] || 0;
            });

            setDashboardData(updatedData);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getData();
    }, [getData]);
    return { isLoading, dashboardData };
};

export default useEcomGetData;
