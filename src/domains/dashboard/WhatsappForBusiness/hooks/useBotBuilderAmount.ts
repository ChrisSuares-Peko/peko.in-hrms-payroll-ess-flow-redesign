import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBotBuilderAmount } from '../api';
import { botBuilderAmount } from '../types/types';

type UseActiveSubscriptionResult = {
    data: botBuilderAmount | null;
    isLoading: boolean;
    error: string | null;
};

export function useBotBuilderAmount(): UseActiveSubscriptionResult & { refresh: () => void } {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<botBuilderAmount | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBotBuilderAmount = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getBotBuilderAmount({
                userId: id,
                userType: role,
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
    }, [id, role]);

    useEffect(() => {
        fetchBotBuilderAmount();
    }, [fetchBotBuilderAmount]);

    const refresh = () => {
        fetchBotBuilderAmount();
    };
    return { data, isLoading, error, refresh };
}
