import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTopUpHistory } from '../api/index';
import { topUpHistoryList } from '../types/ordersList';

export default function useGetTopUpList(
    itemsPerPage: number,
    page: number,
    searchText: string,
    iccid: string
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [records, setRecords] = useState<any[]>();
    const [totalRecord, setTotalRecord] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const getOrders = useCallback(async () => {
        const data: topUpHistoryList | false = await getTopUpHistory({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
            iccid,
            fromDate: '',
            toDate: '',
        });

        if (data) {
            const arr = data.data.map(item => ({
                date: item.createdAt,
                plan: item.data,
                validity: item.validity,
                amount: item.amountInINR,
                paymentMethod: (item.paymentMode ?? '').toLowerCase(),
            }));

            setRecords(arr);
            setTotalRecord(data.recordsTotal);
        }
        setIsLoading(false);
    }, [iccid, id, itemsPerPage, page, role, searchText]);

    useEffect(() => {
        getOrders();
    }, [getOrders]);

    return { topUpdata: records, totalRecord, isLoading };
}
