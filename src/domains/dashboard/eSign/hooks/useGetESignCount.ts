import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getESignCount } from '../api';
import { eSignResponse } from '../types';

export default function useGetESignCount() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number | undefined>(undefined);
    const [pendingCount, setPendingCount] = useState<number | undefined>(undefined);
    const [completedCount, setCompletedCount] = useState<number | undefined>(undefined);
    const [lastAdded, setLastAdded] = useState<string | undefined>(undefined);

    const getSignCount = useCallback(async () => {
        setIsLoading(true);
        const data: eSignResponse | false = await getESignCount({
            userId: id,
            userType: role,
        });

        if (data) {
            setCount(data.count);
            setPendingCount(data.pendingCount);
            setCompletedCount(data.completedCount);
            setLastAdded(data.lastESignAddedDate);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getSignCount();
    }, [getSignCount, refresh]);

    return { isLoading, count, pendingCount, completedCount, setRefresh, lastAdded };
}
