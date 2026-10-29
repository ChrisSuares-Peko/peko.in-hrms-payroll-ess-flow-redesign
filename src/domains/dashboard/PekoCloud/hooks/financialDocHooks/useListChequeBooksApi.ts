import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listChequeBooks } from '../../api/financialDoc';
import { ChequeBookListingResponse } from '../../types/financials/index';

export const useGetAllChequeBooksApi = (
    page: number,
    itemsPerPage: number,
    reloadTable: boolean,
    searchText: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [chequeBookListData, setChequeBookListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const getChequeBookList = useCallback(async () => {
        setIsLoading(true);
        const data: ChequeBookListingResponse | false = await listChequeBooks({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
        });

        if (data) {
            const arr = data?.result?.map(item => ({
                action: '',
                documentAvailability: item.document ? 'Available' : 'NA',
                ...item,
            }));
            setCount(data.totalData);
            setChequeBookListData(arr);
        }
        setIsLoading(false);
    }, [id, role, itemsPerPage, page, searchText]);
    useEffect(() => {
        getChequeBookList();
    }, [getChequeBookList, reloadTable]);

    return {
        tableDatas: chequeBookListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
