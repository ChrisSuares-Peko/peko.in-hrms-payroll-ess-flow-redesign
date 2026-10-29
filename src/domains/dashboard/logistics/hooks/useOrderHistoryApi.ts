import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTransactionsApi } from '../api/index';
import {
    OrderTableItem,
    TransactionsRequestPayload,
    TransactionsResponse,
    useOrderHistoryApiProps,
} from '../types/orderHistory';

export function useOrderHistoryApi({ page, itemsPerPage, search, sort }: useOrderHistoryApiProps) {
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
        };
        setIsLoading(true);
        const data: TransactionsResponse | false = await getTransactionsApi(payLoad);
        if (data && data.result.length > 0) {
            const ordersData = data;
            const arr: OrderTableItem[] = ordersData?.result?.map(item => {
                const orderResponse = JSON.parse(item?.order?.orderResponse || '{}');
                return {
                    key: item?.order?.id,
                    id: item?.order?.id,
                    serviceType: orderResponse?.serviceType || '',
                    amount: orderResponse?.orderAmount || 0,
                    date: item?.order?.transactionDate,
                    status: item?.order?.status,
                    transactionId: item?.order?.corporateTxnId,
                    providerId: item?.order?.providerId || '',
                };
            });
            setOrders(arr);
            setCount(ordersData.totalData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
        setIsLoading(false);
    }, [id, role, page, itemsPerPage, search, sort]);

    useEffect(() => {
        getOrderHistoryList();
    }, [getOrderHistoryList]);

    return { orders, isLoading, count };
}
