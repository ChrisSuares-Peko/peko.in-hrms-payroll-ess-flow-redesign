import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTotalSpentCounts } from '../api/index';
import { TotalSpentResponse } from '../types/index';

export default function useCountApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [spentData, setSpentData] = useState<TotalSpentResponse>();
    const [isLoading, setIsLoading] = useState(true);

    const getDashboardCounts = useCallback(async () => {
        const data: TotalSpentResponse | false = await getTotalSpentCounts({
            userId: id,
            userType: role,
        });
        if (data) {
            setSpentData(data);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getDashboardCounts();
    }, [getDashboardCounts]);

    return { data: spentData, isLoading };
}
