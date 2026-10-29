import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPosPlans } from '../api';
import { PackageDetails, SubscriptionApiPayload } from '../types';

export function useGetPosSubscription({ accessKey }: { accessKey: string }) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [packages, setPackages] = useState<PackageDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        const payload: SubscriptionApiPayload = { userId: id, userType: role, accessKey };
        const data = await getPosPlans(payload);
        if (data) {
            const { packageDetails } = data;
            if (Array.isArray(packageDetails) && packageDetails.length) {
                setPackages(
                    [...packageDetails].sort(
                        (a, b) => (a.priorityLevel ?? 0) - (b.priorityLevel ?? 0)
                    )
                );
            }
        }
        setIsLoading(false);
    }, [accessKey, id, role]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    return { packages, isLoading };
}
