import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { CardQuota, getCardQuota } from '../../api/user/cardQuotaApi';

export const useCardQuotaApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [quota, setQuota] = useState<CardQuota | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQuota = useCallback(async () => {
        const res = await getCardQuota(role, id);
        if (res && res.data) return res.data;
        return null;
    }, [role, id]);

    useEffect(() => {
        let active = true;
        (async () => {
            setIsLoading(true);
            const next = await fetchQuota();
            if (!active) return;
            setQuota(next);
            setIsLoading(false);
        })();
        return () => {
            active = false;
        };
    }, [fetchQuota]);

    const refetchQuota = useCallback(async () => {
        const next = await fetchQuota();
        if (next) setQuota(next);
    }, [fetchQuota]);

    return { quota, isLoading, refetchQuota };
};
