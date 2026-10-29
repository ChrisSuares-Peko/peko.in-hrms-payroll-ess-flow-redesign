import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    SubscriptionDetailsQuery,
    SubscriptionDetailsRow,
    getSubscriptionDetails,
} from '../api/subscriptionDetails';

export default function useSubscriptionDetails(filters: SubscriptionDetailsQuery) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [tableData, setTableData] = useState<SubscriptionDetailsRow[]>([]);
    const [count, setCount] = useState(0);

    const fetchRows = useCallback(async () => {
        setIsLoading(true);
        const data = await getSubscriptionDetails({ userId: id, userType: role, ...filters });
        if (data) {
            setTableData(data.result || []);
            setCount(data.totalData || 0);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    return { isLoading, tableData, count, refetch: fetchRows };
}
