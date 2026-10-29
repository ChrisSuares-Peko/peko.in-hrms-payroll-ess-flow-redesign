import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTransactionDetail } from '../api';
import { TransactionDetailData } from '../types/paymentLinkTypes';

export default function useGetTransactionDetail(id: string | undefined) {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<TransactionDetailData | null>(null);
    const [notFound, setNotFound] = useState(false);

    const fetchDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const result = await getTransactionDetail({ userId, userType: role, id });
        setIsLoading(false);
        if (!result) {
            setNotFound(true);
            return;
        }
        setData(result);
    }, [userId, role, id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    return { isLoading, data, notFound };
}
