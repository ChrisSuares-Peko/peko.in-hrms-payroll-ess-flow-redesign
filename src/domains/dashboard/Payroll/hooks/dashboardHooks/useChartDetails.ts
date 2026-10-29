import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { chartDetails } from '../../api/dashBoardIndex';
import { chartData, chartResponse } from '../../types/dashboardTypes';

export function useChartDetailsApi() {
    const currentDate = new Date();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [year, setYear] = useState<string>(currentDate.getFullYear().toString());
    const [details, setDetails] = useState<chartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Per-year cache scoped to this mount — switching years within a single dashboard
    // visit is instant on return, but every fresh visit to the dashboard refetches,
    // so the chart always reflects the latest server data.
    const chartDataCache = useRef<Record<string, chartData[]>>({});

    const handleYearChange = (value: string) => {
        setYear(value);
    };

    const getChartData = useCallback(async () => {
        if (chartDataCache.current[year]) {
            setDetails(chartDataCache.current[year]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const data: chartResponse | false = await chartDetails({
            userId: id,
            userType: role,
            year,
        });
        if (data) {
            chartDataCache.current[year] = data.chartData;
            setDetails(data.chartData);
        }
        setIsLoading(false);
    }, [id, role, year]);

    useEffect(() => {
        getChartData();
    }, [getChartData]);

    return { isLoading, data: details, handleYearChange, year };
}
