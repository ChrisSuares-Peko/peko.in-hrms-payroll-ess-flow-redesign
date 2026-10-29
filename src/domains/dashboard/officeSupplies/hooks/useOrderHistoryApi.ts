/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';

import { debounce } from 'lodash';

import { useAppSelector } from '@src/hooks/store';

import { getTransactionsApi } from '../api/orderHistory';
import {
    OrderTableItem,
    TransactionsRequestPayload,
    TransactionsResponse,
    useOrderHistoryApiProps,
} from '../types/orderHistory';

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
    const [previousSearch, setPreviousSearch] = useState(searchText);
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
            const arr: OrderTableItem[] = ordersData?.result?.map(item => {
                const orderResponse = JSON.parse(item.order.orderResponse);
                return {
                    id: item?.order?.id,
                    products: orderResponse.products,
                    amount: item?.order?.amountInAed,
                    date: item?.order?.transactionDate,
                    status: item?.order?.ecomOrderStatus,
                    transactionId: item?.order?.corporateTxnId,
                };
            });

            setOrders(arr);
            setCount(ordersData.totalData);
            setIsLoading(false);
        }
        setIsLoading(false);
    }, [id, role, from, to, itemsPerPage, page, searchText, sort]);

    const debounceGetOrderHistoryList = useCallback(
        debounce(() => {
            getOrderHistoryList();
            setPreviousSearch(searchText);
        }, 500),
        [getOrderHistoryList, searchText]
    );

    useEffect(() => {
        if (previousSearch !== searchText) {
            debounceGetOrderHistoryList();
        } else {
            getOrderHistoryList();
        }
        return () => {
            debounceGetOrderHistoryList.cancel();
        };
    }, [getOrderHistoryList, debounceGetOrderHistoryList, searchText, page, itemsPerPage]);

    return { orders, isLoading, count };
}
