import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getNupayOnboardingStatus } from '../api';
import { NupayOnboardingStatusData } from '../types';

export default function useNupayMerchants() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setLoading] = useState(true);
    const [statusData, setStatusData] = useState<NupayOnboardingStatusData | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        const res = await getNupayOnboardingStatus(role, id);
        setStatusData(res);
        setLoading(false);
        return res;
    }, [role, id]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { statusData, isLoading, fetchStatus };
}
