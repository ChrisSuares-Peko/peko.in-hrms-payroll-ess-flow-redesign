import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOndcEasySplitSellers } from '../../api/ondcSellers';
import { AdminOndcEasySplitSeller, OndcSellersQuery } from '../../types/ondcSeller';

/** Admin Easy Split vendors list (Products → Vendors tab). */
const useOndcEasySplitSellers = (filters: OndcSellersQuery) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [tableData, setTableData] = useState<AdminOndcEasySplitSeller[]>([]);

    const fetchList = useCallback(async () => {
        setIsLoading(true);
        const data = await getOndcEasySplitSellers({ userId: id, userType: role, ...filters });
        if (data) {
            setTableData(data.data || []);
            setCount(data.recordsTotal || 0);
        } else {
            setTableData([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    return { isLoading, tableData, count, refetch: fetchList };
};

export default useOndcEasySplitSellers;
