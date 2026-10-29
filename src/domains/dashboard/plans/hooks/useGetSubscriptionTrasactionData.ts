import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getTransactionDetails } from '../api';
import { SubscriptionDetailsResponse } from '../types';

export default function useGetSubscriptionTrasactionData(transactionId: string | null) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [transactionData, setTransactionData] = useState<SubscriptionDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const getTransactionData = useCallback(async () => {
        if (!transactionId) {
            setIsLoading(false);
            return;
        }
        const data: SubscriptionDetailsResponse | false = await getTransactionDetails({
            userId: id,
            userType: role,
            transactionId,
        });
        if (data) {
            setTransactionData(data);
            setIsLoading(false);
        } else {
            navigate(paths.dashboard.home);
        }
    }, [id, role, transactionId, navigate]);

    useEffect(() => {
        getTransactionData();
    }, [getTransactionData]);

    return { transactionData, isLoading };
}
