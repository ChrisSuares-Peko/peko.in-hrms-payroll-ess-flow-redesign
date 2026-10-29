import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEcommercePlans } from '../api';
import { PackageDetails, SubscriptionDetailsResponse } from '../types';

type Props = {
    accessKey: string;
};

export function useGetEcommerceSubscription({ accessKey }: Props) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [packages, setPackages] = useState<PackageDetails[]>();
    const [isLoading, setIsLoading] = useState(true);

    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        const data: SubscriptionDetailsResponse | false = await getEcommercePlans({
            userId: id,
            userType: role,
            accessKey,
        });
        if (data) {
            const { packageDetails } = data;
            if (Array.isArray(packageDetails) && packageDetails.length) {
                setPackages(packageDetails);
            }
        }
        setIsLoading(false);
    }, [accessKey, id, role]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    return { packages, isLoading };
}
