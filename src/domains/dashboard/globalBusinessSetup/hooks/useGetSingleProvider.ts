import { useEffect, useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getProviderDetails } from '../api/globalBusinessSetup';
import { Provider } from '../types/globalBusinessSetup';

type Options = {
    enabled?: boolean;
};

export const useProviderDetails = (providerId: string | null, options: Options = {}) => {
    const { enabled = true } = options;

    const [provider, setProvider] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { role, id } = useAppSelector(state => state.reducer.auth);

    const fetchProvider = useCallback(async () => {
        if (!enabled || !providerId) return;

        setLoading(true);
        setError(null);

        try {
            const res = await getProviderDetails({
                providerId,
                userId: id,
                userType: role,
            });

            setProvider(res || null);
        } catch (err) {
            console.error('Provider API Error:', err);
            setError('Failed to load provider details.');
        } finally {
            setLoading(false);
        }
    }, [enabled, providerId, id, role]);

    useEffect(() => {
        fetchProvider();
    }, [fetchProvider]);

    return { providerData: provider, loading, error };
};
