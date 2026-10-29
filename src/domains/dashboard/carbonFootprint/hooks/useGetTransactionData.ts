import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTransactions } from '../api/index';
import { transactionListingResponse, tableData } from '../types/dashboard';

export default function useGetTransactionData(
    searchText: string,
    sort: string,
    page: number,
    itemsPerPage: number,
    filter: string,
    from: string,
    to: string
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [reportRows, setReportRows] = useState<tableData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getReportList = useCallback(async () => {
        setIsLoading(true);
        const data: transactionListingResponse | false = await getTransactions({
            userId: id,
            userType: role,
            from,
            to,
            searchText,
            sort,
            page,
            itemsPerPage,
            filter,
        });

        if (data) {
            setReportRows(data.data);
            setCount(data.count);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, filter, from, itemsPerPage, page, searchText, to, sort]);
    useEffect(() => {
        getReportList();
    }, [getReportList]);
    return { data: reportRows, count, isLoading };
}
