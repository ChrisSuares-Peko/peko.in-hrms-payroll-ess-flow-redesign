import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPayrollAccountStatusApi } from '../api/payrollAccount';
import { PayrollAccountStatus } from '../types/payrollAccount';

export default function useGetPayrollAccountStatus() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<PayrollAccountStatus | null>(null);

    const fetchStatus = useCallback(async () => {
        setIsLoading(true);
        const resp = await getPayrollAccountStatusApi({ userId: id, userType: role });
        if (resp) {
            setData(resp);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { isLoading, data, refetch: fetchStatus };
}
