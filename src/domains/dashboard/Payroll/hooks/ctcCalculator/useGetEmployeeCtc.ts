import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeeCtcApi } from '../../api/ctcCalculator';

export function useGetEmployeeCtc(employeeId: string | null) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCtc = useCallback(async () => {
        if (!employeeId) return;
        setIsLoading(true);
        const result = await getEmployeeCtcApi({ userId: id, userType: role, employeeId });
        if (result) setData(result);
        setIsLoading(false);
    }, [employeeId, id, role]);

    useEffect(() => {
        fetchCtc();
    }, [fetchCtc]);

    return { data, isLoading, refetch: fetchCtc };
}
