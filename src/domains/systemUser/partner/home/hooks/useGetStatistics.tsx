import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchChartData } from '../api/index';
import { PartnerChart } from '../types/types';
// import { CorporateData, Data, MonthlyStatistic, todaysDatas, totalDatas } from '../types/types';

const useGetStatistics = (month: number, year: number) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState<PartnerChart>();

    const getChartData = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchChartData({
            userId: id,
            userType: role,
            month,
            year,
        });

        if (data) {
            setChartData(data);
        }
        setIsLoading(false);
    }, [id, role, month, year]);

    useEffect(() => {
        getChartData();
    }, [getChartData, month, year]);

    return { isLoading, chartData };
};

export default useGetStatistics;
