import { useCallback, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { refreshFleetData } from '../api';
import { getNextRefreshOn, isRefreshAllowed, nextRefreshMessage } from '../utils/vehicleRefresh';

type RefreshTarget = {
    id: number | string;
    lastRefreshedAt?: string | null;
};

/**
 * Ticket 31321. Re-pulls one vehicle's RC from the vendor, capped at once a week.
 *
 * Every call costs money, so a click is refused on the client whenever the window has not elapsed —
 * the request is never made. The server applies the same rule, and its answer wins if the two
 * disagree (a stale list, a second tab, a tampered request).
 */
export default function useRefreshVehicle(onRefreshed?: () => void) {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [refreshingId, setRefreshingId] = useState<number | string | null>(null);
    // State alone would not stop two clicks landing in the same tick (both read the pre-update value),
    // and the point of the whole ticket is that a stray click costs money. The ref flips synchronously.
    const inFlight = useRef(false);

    const refreshVehicle = useCallback(
        async ({ id, lastRefreshedAt }: RefreshTarget) => {
            if (inFlight.current) return false;

            if (!isRefreshAllowed(lastRefreshedAt)) {
                dispatch(
                    showToast({
                        description: nextRefreshMessage(getNextRefreshOn(lastRefreshedAt)),
                        variant: 'info',
                    })
                );
                return false;
            }

            inFlight.current = true;
            setRefreshingId(id);
            const data = await refreshFleetData({ userType: role, userId, id });
            inFlight.current = false;
            setRefreshingId(null);

            // `false` means the request itself failed; the interceptor has already shown why.
            if (!data) return false;

            if (!data.refreshed) {
                dispatch(
                    showToast({
                        description: nextRefreshMessage(data.nextRefreshOn),
                        variant: 'info',
                    })
                );
                return false;
            }

            dispatch(
                showToast({
                    description: 'Vehicle details refreshed successfully',
                    variant: 'success',
                })
            );
            onRefreshed?.();
            return true;
        },
        [dispatch, onRefreshed, role, userId]
    );

    return { refreshVehicle, refreshingId };
}
