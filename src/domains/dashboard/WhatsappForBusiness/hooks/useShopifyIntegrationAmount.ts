import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getShopifyIntegrationAmount } from '../api';
import { shopifyIntegrationAmount } from '../types/types';

type UseActiveSubscriptionResult = {
    data: shopifyIntegrationAmount | null;
    isLoading: boolean;
    error: string | null;
};

export function useShopifyIntegrationAmount(): UseActiveSubscriptionResult & {
    refresh: () => void;
} {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<shopifyIntegrationAmount | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchShopifyIntegrationAmount = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getShopifyIntegrationAmount({
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
        fetchShopifyIntegrationAmount();
    }, [fetchShopifyIntegrationAmount]);

    const refresh = () => {
        fetchShopifyIntegrationAmount();
    };
    return { data, isLoading, error, refresh };
}
