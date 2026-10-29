import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTransactionsApi } from '../api/index';
import { OrderTableItem, orderHistoryResponse, tablePayload } from '../types/index';

export function useOrderHistoryApi({
    page,
    itemsPerPage,
    search,
    sort,
    fromDate,
    toDate,
}: tablePayload) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [orders, setOrders] = useState<OrderTableItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getOrderHistoryList = useCallback(async () => {
        setIsLoading(true);
        const payLoad: any = {
            userId: id,
            userType: role,
            sort,
            page,
            itemsPerPage,
            search,
            fromDate,
            toDate,
        };
        const data: orderHistoryResponse | false = await getTransactionsApi(payLoad);
        if (data && data.result.length > 0) {
            const ordersData = data;
            const arr: OrderTableItem[] = ordersData.result.map(item => {
                const orderResponse = JSON.parse(item.orderResponse);
                return {
                    key: item?.id,
                    date: item?.transactionDate,
                    plan: orderResponse?.planDetails?.name || 'N/A',
                    transactionId: item?.corporateTxnId,
                    billingCycle: orderResponse?.planDetails?.billingCycle?.toLowerCase() || 'N/A',
                    amount: item?.amountInINR,
                    status: item?.workspaceOrderStatus,
                };
            });
            setOrders(arr);
            setCount(ordersData.totalData);
        } else {
            setOrders([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [id, role, page, itemsPerPage, search, sort, toDate, fromDate]);

    useEffect(() => {
        getOrderHistoryList();
    }, [getOrderHistoryList]);

    return { orders, isLoading, count };
}
