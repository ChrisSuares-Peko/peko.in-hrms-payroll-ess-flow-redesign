import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCarReportPlans, updateCarReportPlanStatus } from '../../api/carReportPlans';
import { CarReportPlan, GetCarReportPlansParams } from '../../types/carReportPlan';

export default function useGetAllCarReportPlans(filters: GetCarReportPlansParams) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [tableData, setTableData] = useState<CarReportPlan[]>([]);

    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        const data = await getCarReportPlans({ userId: id, userType: role, ...filters });
        if (data) {
            setTableData(data.plans);
            setCount(data.count);
        }
        setRefresh(false);
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, role, JSON.stringify(filters)]);

    const updateStatus = useCallback(
        async (payload: { id: number | string; status: boolean }) => {
            setIsLoading(true);
            const data = await updateCarReportPlanStatus({ userId: id, userType: role, ...payload });
            if (data) setRefresh(true);
            setIsLoading(false);
        },
        [id, role]
    );

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans, refresh]);

    return { tableData, loading: isLoading, count, setRefresh, updateStatus };
}
