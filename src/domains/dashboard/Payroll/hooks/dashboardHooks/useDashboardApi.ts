import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDashboardDetails } from '../../api/dashBoardIndex';
import { activities, dashboardResponse } from '../../types/dashboardTypes';

// Module-level shared cache — persists for the browser session.
// All specialized dashboard hooks share this single fetch to avoid duplicate API calls.
let dashboardCache: dashboardResponse | null = null;
let pendingFetch: Promise<dashboardResponse | false> | null = null;

/** Returns the current in-memory cache value (null if not yet fetched). */
export function getCachedDashboardData(): dashboardResponse | null {
    return dashboardCache;
}

/** Clears the in-memory cache so the next consumer triggers a fresh API call. */
export function invalidateDashboardCache(): void {
    dashboardCache = null;
    pendingFetch = null;
}

/**
 * Shared fetch coordinator — makes at most ONE real API call regardless of
 * how many hooks call it concurrently.  Subsequent callers await the same
 * in-flight promise; cache hits return instantly.
 */
export async function fetchDashboardData(
    id: number,
    role: string
): Promise<dashboardResponse | false> {
    if (dashboardCache) return dashboardCache;
    if (!pendingFetch) {
        pendingFetch = getDashboardDetails({ userId: id, userType: role }).then(data => {
            pendingFetch = null;
            if (data) dashboardCache = data;
            return data || false;
        });
    }
    return pendingFetch;
}

export function useDashboardApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [details, setDetails] = useState<dashboardResponse | undefined>(
        dashboardCache ?? undefined
    );
    const [isLoading, setIsLoading] = useState(!dashboardCache);
    const [activityData, setActivityData] = useState<activities[]>(
        dashboardCache?.upcomingActivities?.slice(0, 6) ?? []
    );
    const [deductionSummaryData, setDeductionSummaryData] = useState<
        dashboardResponse['deductionSummary'] | undefined
    >(dashboardCache?.deductionSummary ?? undefined);

    const getDashboardData = useCallback(async () => {
        const data = await fetchDashboardData(id, role);
        if (data) {
            setDetails(data);
            setActivityData((data.upcomingActivities as activities[]).slice(0, 6));
            setDeductionSummaryData(data.deductionSummary);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getDashboardData();
    }, [getDashboardData]);

    return { isLoading, data: details, activities: activityData, deductionSummaryData };
}
