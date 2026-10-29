import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTransactionDetails } from '../api/index';
import { TransactionDetailsResponse } from '../types/index';

export default function useGetTrasactionData(transactionId: string | null) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [transactionData, setTransactionData] = useState<TransactionDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);

    const getTransactionData = useCallback(async () => {
        if (!transactionId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const data: TransactionDetailsResponse | false = await getTransactionDetails({
            userId: id,
            userType: role,
            transactionId,
        });
        if (data) {
            setTransactionData(data);
        }
        setIsLoading(false);
    }, [id, role, transactionId]);

    useEffect(() => {
        getTransactionData();
    }, [getTransactionData]);

    return { transactionData, isLoading };
}
