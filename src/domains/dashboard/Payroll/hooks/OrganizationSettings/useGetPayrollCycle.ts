import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPayrollCycle } from '../../api/organizationSettings';
import { GetPayrollSettingsType } from '../../types/organizationSettings';

export default function useGetPayrollCycle() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [payrollCycleData, setPayrollCycleData] = useState<GetPayrollSettingsType | null>(null);

    const fetchPayrollCycle = useCallback(async () => {
        setIsLoading(true);
        const res = await getPayrollCycle({ userId: id, userType: role });
        if (res) {
            setPayrollCycleData(res);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchPayrollCycle();
    }, [fetchPayrollCycle]);

    return {
        isLoading,
        payrollCycleData,
    };
}
