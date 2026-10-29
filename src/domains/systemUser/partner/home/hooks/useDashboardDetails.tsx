import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchDashboardData } from '../api/index';
import { DashboardDetails } from '../types/types';
// import { CorporateData, Data, MonthlyStatistic, todaysDatas, totalDatas } from '../types/types';

const useDashboardDetails = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardDetails | undefined>();

    const getDashboardData = useCallback(async () => {
        const data = await fetchDashboardData({
            userId: id,
            userType: role,
        });

        if (data) {
            const result = {
                totalTransactions: convertToNumber(data.totalTransactions),
                totalRevenue: convertToNumber(data.totalRevenue),
                totalCashback: convertToNumber(data.totalCashback),
                totalNetworkShare: convertToNumber(data.totalNetworkShare),
                todaysRevenue: convertToNumber(data.todaysRevenue),
                todaysCashback: convertToNumber(data.todaysCashback),
                todaysNetworkShare: convertToNumber(data.todaysNetworkShare),
                todaysTransactions: convertToNumber(data.todaysTransactions),
                totalCorporateUsers: convertToNumber(data.totalCorporateUsers),
                activeUsers: convertToNumber(data.activeUsers),
                todaysCorporateUsers: convertToNumber(data.todaysCorporateUsers),
                todaysActiveUsers: convertToNumber(data.todaysActiveUsers),
            };
            setDashboardData(result);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getDashboardData();
    }, [getDashboardData]);

    return { isLoading, dashboardData };
};

function convertToNumber(value: number | string | null | undefined) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') {
        value = parseFloat(value);
    }
    return Number(value.toFixed(2));
}

export default useDashboardDetails;
