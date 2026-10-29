import { useCallback, useEffect, useState } from 'react';

import { getPurchaseHistory } from '../../settings/api/subscription';
import {
    ActiveSubscription,
    PackageStatus,
    ResponseDataSubscriptionHistory,
} from '../../settings/types/subscription';

export default function useVerificationPlan() {
    const [plan, setPlan] = useState<ActiveSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getPlan = useCallback(async () => {
        setIsLoading(true);
        const data: ResponseDataSubscriptionHistory | false = await getPurchaseHistory({
            page: 1,
            itemsPerPage: 1000,
            status: PackageStatus.Active,
        });

        if (data) {
            setPlan(data.currentGroupSubscription || null);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        getPlan();
    }, [getPlan]);

    return { plan, loading: isLoading, refresh: getPlan };
}
