import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAttendanceMetrics, type AttendanceMetrics } from '../../api/employeeApi';

const DEFAULT_METRICS: AttendanceMetrics = {
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
    otHours: 0,
    month: { from: '', to: '' },
};

export function useAttendanceMetrics(employeeId: string, month: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [metrics, setMetrics] = useState<AttendanceMetrics>(DEFAULT_METRICS);
    const [isLoading, setIsLoading] = useState(false);

    const load = useCallback(async () => {
        if (!employeeId) return;
        setIsLoading(true);
        const data = await getAttendanceMetrics({
            userType: role,
            userId: id,
            employeeId,
            month,
        });
        setMetrics(data || DEFAULT_METRICS);
        setIsLoading(false);
    }, [role, id, employeeId, month]);

    useEffect(() => {
        load();
    }, [load]);

    return { metrics, isLoading, refetch: load };
}
