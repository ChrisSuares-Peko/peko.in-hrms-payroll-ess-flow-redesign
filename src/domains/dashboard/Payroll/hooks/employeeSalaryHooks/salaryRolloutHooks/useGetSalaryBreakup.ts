import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSalaryBreakup } from '../../../api/employeeSalaryApi/salaryRolloutApi';
import { SalaryBreakupData } from '../../../types/salaryProfileTypes/salaryRolloutTypes';

export const useGetSalaryBreakup = (employeeId: string | null) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<SalaryBreakupData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBreakup = useCallback(async () => {
        if (!employeeId) return;
        setIsLoading(true);
        const result = await getSalaryBreakup({ userId: String(id), userType: role, employeeId });
        setData(result || null);
        setIsLoading(false);
    }, [id, role, employeeId]);

    useEffect(() => {
        fetchBreakup();
    }, [fetchBreakup]);

    return { data, isLoading };
};
