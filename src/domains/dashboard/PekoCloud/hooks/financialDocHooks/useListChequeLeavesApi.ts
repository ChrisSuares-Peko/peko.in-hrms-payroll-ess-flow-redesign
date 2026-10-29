import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listChequeLeaves } from '../../api/financialDoc';
import { ChequeLeavesListingResponse } from '../../types/financials/index';

export const useGetAllChequeleavesApi = (
    page: number,
    itemsPerPage: number,
    reloadTable: boolean,
    searchText: string,
    chequeBookId: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [chequeLeafListData, setChequeLeafListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const getChequeLeafList = useCallback(async () => {
        setIsLoading(true);
        const data: ChequeLeavesListingResponse | false = await listChequeLeaves({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
            chequeBookId,
        });
        if (data) {
            const arr = data?.result?.map(item => ({
                dateAdded: item?.createdAt ?? '',
                documentAvailability: item.document ? 'Available' : 'NA',
                ...item,
            }));
            setCount(data.totalData);
            setChequeLeafListData(arr);
        }
        setIsLoading(false);
    }, [id, role, itemsPerPage, page, searchText, chequeBookId]);
    useEffect(() => {
        getChequeLeafList();
    }, [getChequeLeafList, reloadTable]);

    return {
        tableDatas: chequeLeafListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
