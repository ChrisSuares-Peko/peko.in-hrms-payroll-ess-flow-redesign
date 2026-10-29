import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDashboardChartData, getDashboardData } from '../api';
import { DashboardActivity, DashboardActiveRfq, DashboardChartData, DashboardData, ProcureStats } from '../types';

export function useDashboard() {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading]           = useState(false);
    const [isChartLoading, setIsChartLoading] = useState(false);
    const [stats, setStats]                   = useState<ProcureStats | null>(null);
    const [activeRfqs, setActiveRfqs]         = useState<DashboardActiveRfq[]>([]);
    const [activity, setActivity]             = useState<DashboardActivity[]>([]);
    const [chartData, setChartData]           = useState<DashboardChartData | null>(null);

    const fetchDashboard = useCallback(async () => {
        setIsLoading(true);
        const data: DashboardData | false = await getDashboardData({ corporateId: String(corporateId) });
        if (data) {
            setStats(data.stats);
            setActiveRfqs(data.activeRfqs ?? []);
            setActivity(data.activity ?? []);
        }
        setIsLoading(false);
    }, [corporateId]);

    const fetchChartData = useCallback(async () => {
        setIsChartLoading(true);
        const data = await getDashboardChartData({ corporateId: String(corporateId) });
        if (data) setChartData(data);
        setIsChartLoading(false);
    }, [corporateId]);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
    useEffect(() => { fetchChartData(); }, [fetchChartData]);

    return { isLoading, isChartLoading, stats, activeRfqs, activity, chartData, fetchDashboard, fetchChartData };
}
