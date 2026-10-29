import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getRevisionHistoryApi, SalaryRevisionHistoryEntry } from '../../api/organizationSettings/index';

export function useGetRevisionHistory(employeeId: string | null) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<SalaryRevisionHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!employeeId) return;
        setIsLoading(true);
        const result = await getRevisionHistoryApi({ userId: id, userType: role, employeeId });
        if (result.success && result.data) setData(result.data);
        setIsLoading(false);
    }, [employeeId, id, role]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return { data, isLoading, refetch: fetchHistory };
}
