import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { OrderHistoryApi } from '../api';
import { HistoryTableItem, OrderHistoryApiPayload, OrderHistoryApiResponse } from '../types';

export default function useESignHistory({
    searchText,
    pageSize,
    page,
    from,
    to,
}: OrderHistoryApiPayload) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<HistoryTableItem[]>();

    const getOrderHistory = useCallback(async () => {
        setIsLoading(true);
        const data: OrderHistoryApiResponse | false = await OrderHistoryApi({
            userId: id,
            userType: role,
            searchText,
            pageSize,
            page,
            from,
            to,
        });

        if (data) {
            setTableData(data.rows);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [from, id, page, pageSize, role, searchText, to]);

    useEffect(() => {
        getOrderHistory();
    }, [getOrderHistory, refresh]);

    return { tableData, isLoading, count, setRefresh };
}
