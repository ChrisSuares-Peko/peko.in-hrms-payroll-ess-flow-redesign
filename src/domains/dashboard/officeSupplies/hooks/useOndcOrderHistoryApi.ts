/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';

import { debounce } from 'lodash';

import { useAppSelector } from '@src/hooks/store';

import { getOndcOrderHistoryApi } from '../api/ondcOrderHistory';
import { OndcOrderHistoryFilters, OndcOrderHistoryResponse, OndcOrderRow } from '../types/ondcOrderHistory';

/**
 * ONDC Order History list (confirmed seller orders). Mirrors useOrderHistoryApi's
 * shape: local state, debounced re-fetch on search text, immediate re-fetch on
 * page/date change.
 */
export function useOndcOrderHistoryApi({ from, to, search, page, itemsPerPage }: OndcOrderHistoryFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [orders, setOrders] = useState<OndcOrderRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(0);
    const [previousSearch, setPreviousSearch] = useState(search);

    const getOrderHistoryList = useCallback(async () => {
        setIsLoading(true);
        const data: OndcOrderHistoryResponse | false = await getOndcOrderHistoryApi({
            userId: id,
            userType: role,
            from,
            to,
            search,
            page,
            itemsPerPage,
        });
        if (data) {
            setOrders(data.rows);
            setCount(data.count);
        }
        setIsLoading(false);
    }, [id, role, from, to, search, page, itemsPerPage]);

    const debounceGetOrderHistoryList = useCallback(
        debounce(() => {
            getOrderHistoryList();
            setPreviousSearch(search);
        }, 500),
        [getOrderHistoryList, search]
    );

    useEffect(() => {
        if (previousSearch !== search) {
            debounceGetOrderHistoryList();
        } else {
            getOrderHistoryList();
        }
        return () => {
            debounceGetOrderHistoryList.cancel();
        };
    }, [getOrderHistoryList, debounceGetOrderHistoryList, search, page, itemsPerPage]);

    return { orders, isLoading, count };
}
