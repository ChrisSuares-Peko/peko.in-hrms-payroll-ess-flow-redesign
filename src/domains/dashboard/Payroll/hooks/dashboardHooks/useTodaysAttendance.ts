import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTodayAttendanceCounts } from '../../api/dashBoardIndex';
import { TodayAttendanceCounts } from '../../types/dashboardTypes';

const DEFAULT_COUNTS: TodayAttendanceCounts = { present: 0, late: 0, absent: 0, onLeave: 0 };

export function useTodaysAttendance() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [counts, setCounts] = useState<TodayAttendanceCounts>(DEFAULT_COUNTS);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const data = await getTodayAttendanceCounts({ userId: id, userType: role });
        setCounts(data ?? DEFAULT_COUNTS);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        load();
    }, [load]);

    return { isLoading, counts };
}
