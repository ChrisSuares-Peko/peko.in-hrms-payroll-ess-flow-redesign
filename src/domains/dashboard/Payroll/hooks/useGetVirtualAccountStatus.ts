import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getVirtualAccountStatusApi } from '../api/virtualAccount';
import { VirtualAccountRecord } from '../types/virtualAccount';

export default function useGetVirtualAccountStatus() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<VirtualAccountRecord | null>(null);

    const fetchStatus = useCallback(async () => {
        setIsLoading(true);
        const resp = await getVirtualAccountStatusApi({ userId: id, userType: role });
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
