import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOrderHistoryTable } from '../api/index';
import { BPOSHistory, FilterState, OrderHistoryListResponse } from '../types/index';

export default function useOrderHistory({ start, length, search }: FilterState) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableData, setTableData] = useState<BPOSHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>();

    const getOrderHistoryList = useCallback(async () => {
        setIsLoading(true);
        const data: OrderHistoryListResponse | false = await getOrderHistoryTable({
            userId: id,
            userType: role,
            start,
            length,
            search,
        });
        if (data) {
         
            setTableData(data.result);
            setCount(data.totalData);
        }
        setIsLoading(false);
    }, [id, length, role, search, start]);

    useEffect(() => {
        getOrderHistoryList();
    }, [getOrderHistoryList]);

    return { data: tableData, isLoading, count };
}
