import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTransactionsApi } from '../../api';
import {
    OrderTableItem,
    TransactionsRequestPayload,
    TransactionsResponse,
    useOrderHistoryApiProps,
} from '../../types/orderHistory';

export function useOrderHistoryApi({
    page,
    itemsPerPage,
    search,
    sort,
    from,
    to,
}: useOrderHistoryApiProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [orders, setOrders] = useState<OrderTableItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getOrderHistoryList = useCallback(async () => {
        const payLoad: TransactionsRequestPayload = {
            userId: id,
            userType: role,
            sort,
            page,
            itemsPerPage,
            search,
            from,
            to,
        };
        setIsLoading(true);
        const data: TransactionsResponse | false = await getTransactionsApi(payLoad);
        // if (data && data.result.length > 0) {
        if (data) {
            const ordersData = data;
            setOrders(data.result);
            setCount(ordersData.totalData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, page, itemsPerPage, search, sort, from, to]);

    useEffect(() => {
        getOrderHistoryList();
    }, [getOrderHistoryList]);

    return { orders, isLoading, count };
}
