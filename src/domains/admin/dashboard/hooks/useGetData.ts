import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDashboardData } from '../api';
import { CorporateData, Data, MonthlyStatistic, todaysDatas, totalDatas } from '../types/types';

const useGetData = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [totalData, setTotalData] = useState<totalDatas>();
    const [todayData, setTodayData] = useState<todaysDatas>();
    const [monthlyCorporates, setMonthlyCorporates] = useState<CorporateData[]>();
    const [monthlyStatistic, setMonthlyStatistic] = useState<MonthlyStatistic[]>();
    const getData = useCallback(async () => {
        const data: Data | false = await getDashboardData({
            userId: id,
            userType: role,
        });

        if (data) {
            const dashData = data;
            setMonthlyCorporates(dashData.monthlyCorporates.reverse() || []);
            setMonthlyStatistic(dashData.monthlyStatistics.reverse() || []);
            setTotalData({
                activeUsers: Number(dashData?.activeUsers.toFixed(2)) ?? 0,
                activeUsersTillDate: Number(dashData?.activeUsersTillDate.toFixed(2)) ?? 0,
                activeCustomers: Number(dashData?.activeCustomers?.toFixed(2)) ?? 0,
                activeCustomersTillDate: Number(dashData?.activeCustomersTillDate?.toFixed(2)) ?? 0,
                totalCashback: Number(dashData?.totalCashback).toFixed(2) ?? 0,
                totalCorporates: Number(dashData?.totalCorporates.toFixed(2)) ?? 0,
                totalCustomers: Number(dashData?.totalCustomers?.toFixed(2)) ?? 0,
                totalRevenue: Number(dashData?.totalRevenue).toFixed(2) ?? 0,
                totalTransactions: Number(dashData?.totalTransactions.toFixed(2)) ?? 0,
                totalVendors: Number(dashData?.totalVendors.toFixed(2)) ?? 0,
            });
            setTodayData({
                todaysCashback: Number(dashData?.todaysCashback).toFixed(2) ?? 0,
                todaysCorporateUsers: Number(dashData?.todaysCorporateUsers.toFixed(2)) ?? 0,
                todaysRevenue: Number(dashData?.todaysRevenue).toFixed(2) ?? 0,
                todaysTransactions: Number(dashData?.todaysTransactions.toFixed(2)) ?? 0,
            });
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getData();
    }, [getData]);
    return { isLoading, todayData, totalData, monthlyCorporates, monthlyStatistic };
};

export default useGetData;
