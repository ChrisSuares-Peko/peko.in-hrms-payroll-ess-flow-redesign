import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSyncProviders } from '../api/packageSync';
import { SyncProvider } from '../types/packageSync';

const useSyncProviders = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [providers, setProviders] = useState<SyncProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const loadProviders = useCallback(async () => {
        setIsLoading(true);
        setHasError(false);
        const data = await getSyncProviders({ userId: id, userType: role });
        if (data) setProviders(data);
        else setHasError(true);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        loadProviders();
    }, [loadProviders]);

    return { providers, isLoading, hasError, loadProviders };
};

export default useSyncProviders;
