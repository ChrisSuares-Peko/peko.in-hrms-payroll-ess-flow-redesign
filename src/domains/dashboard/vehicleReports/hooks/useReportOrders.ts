import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { sanitizeSearchText } from '@utils/sanitizeSearchText';

import { getCarReportOrders } from '../api/index';
import { ReportOrderDetail } from '../types/index';

export interface ReportOrderFilter {
    searchText: string;
    from: string;
    to: string;
    page: number;
    itemsPerPage: number;
}

const initialFilter: ReportOrderFilter = {
    searchText: '',
    from: '',
    to: '',
    page: 1,
    itemsPerPage: 10,
};

// Order history rows. Search, date range and paging are all applied server-side — the
// filter field names deliberately match the endpoint's query params one-for-one, so the
// whole object is passed straight through.
const useReportOrders = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [filter, setFilter] = useState<ReportOrderFilter>(initialFilter);
    const [rows, setRows] = useState<ReportOrderDetail[]>([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const { searchText, from, to, page, itemsPerPage } = filter;

    // `isStale` lets the effect drop a response whose filter has already been replaced;
    // a manual refetch passes nothing and always applies.
    const fetchOrders = useCallback(
        async (isStale: () => boolean = () => false) => {
            setIsLoading(true);
            const resp = await getCarReportOrders({
                userId: id,
                userType: role,
                searchText,
                from,
                to,
                page,
                itemsPerPage,
            });
            if (isStale()) return resp;
            // `false` means the request failed — the ApiClient interceptor has already
            // toasted why, so the page offers a retry rather than an empty "no orders yet".
            if (!resp) {
                setRows([]);
                setCount(0);
                setIsError(true);
            } else {
                setRows(resp.orders);
                setCount(resp.count);
                setIsError(false);
            }
            setIsLoading(false);
            return resp;
        },
        [id, role, searchText, from, to, page, itemsPerPage]
    );

    useEffect(() => {
        let active = true;
        fetchOrders(() => !active);
        return () => {
            active = false;
        };
    }, [fetchOrders]);

    // Any change to what is being filtered on resets to the first page — otherwise a
    // search from page 3 lands on an empty page 3 of the new result set.
    const handleSearch = (nextSearch: string) =>
        setFilter(prev => ({ ...prev, searchText: sanitizeSearchText(nextSearch), page: 1 }));

    const handleDateChange = (nextFrom: string, nextTo: string) =>
        setFilter(prev => ({ ...prev, from: nextFrom, to: nextTo, page: 1 }));

    const handlePageChange = (nextPage: number) => setFilter(prev => ({ ...prev, page: nextPage }));

    return {
        rows,
        count,
        isLoading,
        isError,
        refetch: () => fetchOrders(),
        filter,
        handleSearch,
        handleDateChange,
        handlePageChange,
    };
};

export default useReportOrders;
