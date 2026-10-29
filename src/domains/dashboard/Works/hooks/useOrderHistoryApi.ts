import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTransactionsApi } from '../api/orderHistory';
import {
    OrderTableItem,
    TransactionsRequestPayload,
    TransactionsResponse,
    useOrderHistoryApiProps,
} from '../type/orderHistory';

export function useOrderHistoryApi({
    from,
    to,
    itemsPerPage,
    page,
    searchText,
    sort,
}: useOrderHistoryApiProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [orders, setOrders] = useState<OrderTableItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getOrderHistoryList = useCallback(async () => {
        setIsLoading(true);
        const payLoad: TransactionsRequestPayload = {
            userId: id,
            userType: role,
            from,
            to,
            itemsPerPage,
            page,
            searchText,
            sort,
        };
        const data: TransactionsResponse | false = await getTransactionsApi(payLoad);
        if (data) {
            const ordersData = data as TransactionsResponse;
            const arr: any[] = ordersData?.result
                ?.map(item => {
                    const orderResponse = JSON.parse(item.order.orderResponse);
                    if (!orderResponse) return false;
                    return {
                        id: item?.order?.id,
                        planName: orderResponse?.planDetails?.name,
                        workName: orderResponse?.planDetails?.work?.name,
                        amount: item?.order?.amountInINR,
                        date: item?.order?.transactionDate,
                        status: item?.order?.workspaceOrderStatus,
                        transactionId: item?.order?.corporateTxnId,
                        paymentMode: item?.order?.paymentMode,
                        paymentStatus: item?.order?.status,
                    };
                })
                .filter(item => item !== false);

            setOrders(arr);
            setCount(ordersData.totalData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, from, to, itemsPerPage, page, searchText, sort]);

    useEffect(() => {
        getOrderHistoryList();
    }, [getOrderHistoryList]);

    return { orders, isLoading, count };
}
