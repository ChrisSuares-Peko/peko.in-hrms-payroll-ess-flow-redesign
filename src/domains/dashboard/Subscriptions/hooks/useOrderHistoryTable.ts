/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';

import { debounce } from 'lodash';

import { useAppSelector } from '@src/hooks/store';

import { getOrderHistoryTable } from '../api/index';
import { OrderHistoryListResponse, OrderHistoryTableData } from '../types/types';

export const useOrderHistoryTable = (
    draw: number,
    start: number,
    length: number,
    search: string,
    from: string,
    to: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableData, setTableData] = useState<OrderHistoryTableData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const [previousSearch, setPreviousSearch] = useState(search);
    const getOrderHistoryList = useCallback(async () => {
        setIsLoading(true);
        const data: OrderHistoryListResponse | false = await getOrderHistoryTable({
            userId: id,
            userType: role,
            draw,
            start,
            length,
            search,
            from,
            to,
        });
        if (data) {
            const orderHistoryData = data as OrderHistoryListResponse;

            const arr = orderHistoryData?.result?.map(orderHistory => {
                const orderResponse = JSON.parse(orderHistory.order.orderResponse);

                return {
                    dateandtime: orderHistory.order.transactionDate ?? '',
                    subscriptionName: orderResponse.subscriptionDetails.software?.name ?? '',
                    transactionId: orderHistory.order.corporateTxnId ?? '',
                    plan: orderResponse.subscriptionDetails.name ?? '',
                    paymentMode: orderHistory.order.paymentMode ?? '',
                    amount: orderHistory.order.amountInINR ?? '',
                    status: orderHistory.order.status ?? '',
                };
            });
            setCount(orderHistoryData.totalData);
            setTableData(arr);
        }
        setIsLoading(false);
    }, [draw, id, length, role, search, start, from, to]);

    const debouncedGetOrderHistoryList = useCallback(
        debounce(() => {
            getOrderHistoryList();
            setPreviousSearch(search);
        }, 500),
        [getOrderHistoryList, search]
    );

    useEffect(() => {
        if (previousSearch !== search) {
            debouncedGetOrderHistoryList();
        } else {
            getOrderHistoryList();
        }
        return () => {
            debouncedGetOrderHistoryList.cancel();
        };
    }, [getOrderHistoryList, search, debouncedGetOrderHistoryList, length, start]);

    return { data: tableData, isLoading, count };
};
