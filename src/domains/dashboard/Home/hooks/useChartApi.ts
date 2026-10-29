import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getChartData } from '../api/index';
import { ChartDataResponse } from '../types/index';

export default function useChartApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [chartData, setChartData] = useState<ChartDataResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = (new Date().getMonth() + 1).toString();

    const [paymentMode, setPaymentMode] = useState<string>('all');
    const [year, setYear] = useState<string>(currentYear);
    const [month, setMonth] = useState<string>(currentMonth);
    const [monthlyView, setMonthlyView] = useState<boolean>(false);

    const handlePaymentModeFilter = (value: string) => {
        setPaymentMode(value);
    };
    const handleYearChange = (value: string) => {
        setYear(value);
    };
    const handleMonthChange = (value: string) => {
        setMonth(value);
    };

    const handleMonthlyView = () => {
        setMonthlyView(!monthlyView);
    };

    const getDashboardCounts = useCallback(async () => {
        const data: ChartDataResponse | false = await getChartData({
            userId: id,
            userType: role,
            paymentMode,
            year,
            month,
            monthlyView,
        });
        if (data) {
            setChartData(data);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, paymentMode, year, month, monthlyView]);

    useEffect(() => {
        getDashboardCounts();
    }, [getDashboardCounts, paymentMode, year, month]);

    return {
        data: chartData,
        isLoading,
        filters: {
            handlePaymentModeFilter,
            handleYearChange,
            handleMonthChange,
            handleMonthlyView,
        },
    };
}
