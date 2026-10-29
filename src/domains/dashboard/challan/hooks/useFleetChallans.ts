import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getFleetChallans } from '../api/index';
import { setChallanData } from '../slices/challanSlice';
import { Challan, ChallanSummary, FleetChallansResponse } from '../types/index';

const EMPTY_SUMMARY: ChallanSummary = {
    totalOutstanding: 0,
    pending: 0,
    paid: 0,
    courtMatters: 0,
};

export default function useFleetChallans() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [challans, setChallans] = useState<Challan[]>([]);
    const [summary, setSummary] = useState<ChallanSummary>(EMPTY_SUMMARY);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Real data only — empty on failure/unexpected shape (no mock fallback).
    const apply = useCallback(
        (data: FleetChallansResponse | false): boolean => {
            if (!data) return false;
            const list = Array.isArray(data.challans) ? data.challans : [];
            const summaryData = data.summary ?? EMPTY_SUMMARY;
            setChallans(list);
            setSummary(summaryData);
            setLastUpdated(data.lastUpdated ?? null);
            dispatch(setChallanData({ challans: list, summary: summaryData }));
            return !!data.stale;
        },
        [dispatch]
    );

    // Refresh stale/missing vehicles from the vendor, then apply the fresh aggregate.
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        apply(await getFleetChallans({ userId: id, userType: role, refresh: true }));
        setIsRefreshing(false);
    }, [id, role, apply]);

    // Initial load: render cached data instantly, then refresh in the background if it's stale.
    const load = useCallback(async () => {
        setIsLoading(true);
        const stale = apply(await getFleetChallans({ userId: id, userType: role }));
        setIsLoading(false);
        if (stale) refresh();
    }, [id, role, apply, refresh]);

    useEffect(() => {
        load();
    }, [load]);

    return { challans, summary, isLoading, isRefreshing, lastUpdated, refetch: refresh };
}
