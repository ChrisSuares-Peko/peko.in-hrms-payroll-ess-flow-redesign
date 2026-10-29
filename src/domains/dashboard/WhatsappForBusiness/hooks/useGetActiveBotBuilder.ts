import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { activeBotBuilderApi } from '../api';
import { ActiveSubscriptionResponse } from '../types/types';

type UseActiveSubscriptionResult = {
    data: ActiveSubscriptionResponse | null;
    isLoading: boolean;
    error: string | null;
};

export function useGetActiveBotBuilder(
    isExpiry?: boolean
): UseActiveSubscriptionResult & { refresh: () => void } {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<ActiveSubscriptionResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActiveSubscription = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await activeBotBuilderApi({
                userId: id,
                userType: role,
                isExpiry,
            });
            if (response) {
                setData(response);
            } else {
                setError('No active subscription found');
            }
        } catch (err) {
            setError('Failed to fetch active subscription');
        } finally {
            setIsLoading(false);
        }
    }, [id, role, isExpiry]);

    useEffect(() => {
        fetchActiveSubscription();
    }, [fetchActiveSubscription]);

    const refresh = () => {
        fetchActiveSubscription();
    };
    return { data, isLoading, error, refresh };
}
