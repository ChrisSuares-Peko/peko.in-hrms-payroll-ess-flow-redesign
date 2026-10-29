import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPosDashboard } from '../api';
import { PosDashboardResponse } from '../types';

const POLL_INTERVAL_MS = 20000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

const defaultState: PosDashboardResponse = {
    isPurchased: false,
    restaurant: null,
    subscription: null,
    ssoUrl: null,
    vendorError: null,
};

// The restaurant can sit at `pending` while the POS partner approves it, so the
// dashboard polls until it goes active (and gives up after ten minutes rather
// than hammering a vendor that rate-limits per key).
export default function useRestaurant() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<PosDashboardResponse>(defaultState);
    const [isLoading, setIsLoading] = useState(true);
    const startedAt = useRef<number>(Date.now());

    const fetchDashboard = useCallback(async () => {
        const resp = await getPosDashboard({ userId: id, userType: role });
        if (resp) setData(resp);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const isProvisioning = !data.restaurant || data.restaurant.status === 'pending';

    useEffect(() => {
        if (!isProvisioning) return undefined;
        const timer = setInterval(() => {
            if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
                clearInterval(timer);
                return;
            }
            fetchDashboard();
        }, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [isProvisioning, fetchDashboard]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') fetchDashboard();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [fetchDashboard]);

    return { ...data, isProvisioning, isLoading, refetch: fetchDashboard };
}
