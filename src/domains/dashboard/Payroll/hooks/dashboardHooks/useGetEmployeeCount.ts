import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeeCount } from '../../api/dashBoardIndex';
import { employeeCountResponse } from '../../types/dashboardTypes';

// Module-level cache — instant return on back-navigation
let employeeCountCache: employeeCountResponse | null = null;

/** Clears the in-memory cache so the next consumer triggers a fresh API call. */
export function invalidateEmployeeCountCache(): void {
    employeeCountCache = null;
}

export default function useGetEmployeeCount(enabled = true) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(!employeeCountCache);
    const [count, setCount] = useState<number>(employeeCountCache?.count ?? 0);
    // false while `count` is only the 0 default (not fetched yet, or the fetch failed)
    const [hasCount, setHasCount] = useState<boolean>(!!employeeCountCache);
    const [date, setDate] = useState<string | undefined>(
        employeeCountCache?.lastEmployeeAddedDate
    );

    const getSignCount = useCallback(async () => {
        if (!employeeCountCache) setIsLoading(true);
        const data: employeeCountResponse | false = await getEmployeeCount({
            userId: id,
            userType: role,
        });

        if (data) {
            employeeCountCache = data;
            setCount(data.count);
            setHasCount(true);
            setDate(data.lastEmployeeAddedDate);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        if (!enabled) return;
        getSignCount();
    }, [getSignCount, refresh, enabled]);

    return { isLoading, count, hasCount, setRefresh, date };
}
