import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { accessKeys } from '@utils/accessKeys';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import { getGarageUsage } from '../api';
import { SKIP_TURBO_SUBSCRIPTION_GATE } from '../utils/devFlags';

// Single source of truth for "can the user search / add another Turbo record?".
// Returns:
//   - exhausted: true when used >= max (covers the 0-quota case which the backend now rejects)
//   - message:   prefilled human-readable text for tooltips / inline warnings
//   - refresh:   re-fetch usage after a successful add so the next click reflects the new total
//
// Used by HeaderBanner (search), VehicleDetails (Add to fleet), DriverCard (Add driver) — all
// of those operations hit a paid vendor API on the backend, so we gate them in the UI too.
export const useTurboQuota = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { addonData, isLoading: addonLoading } = useGetAddonDetails(
        accessKeys.garage,
        packageAccessKeys.garage,
        false
    );
    const [usage, setUsage] = useState<{ fleetsUsed: number; driversUsed: number } | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!role || !id) return;
        setLoading(true);
        const data = await getGarageUsage({ userType: role, userId: id });
        if (data) {
            setUsage(data);
        }
        setLoading(false);
    }, [role, id]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const max = addonData?.maxLimit ?? 0;
    const used = (usage?.fleetsUsed ?? 0) + (usage?.driversUsed ?? 0);
    const remaining = Math.max(0, max - used);
    // SKIP_TURBO_SUBSCRIPTION_GATE is dev-only (see utils/devFlags) — it unblocks the buttons
    // locally but leaves max/used/remaining reporting the real numbers.
    const exhausted = !SKIP_TURBO_SUBSCRIPTION_GATE && !addonLoading && !loading && used >= max;

    let message = '';
    if (exhausted) {
        message =
            max === 0
                ? "Your plan doesn't include Turbo searches. Upgrade or purchase an add-on to continue."
                : `You've used all ${max} Turbo searches on your plan. Purchase an add-on to continue.`;
    }

    return {
        max,
        used,
        remaining,
        exhausted,
        message,
        loading: addonLoading || loading,
        refresh,
    };
};
