import { useCallback, useEffect, useState } from 'react';

import { getCurrentSubscription } from '../../api/subscription';
import { CurrentPlanResponse, CurrentSubscription } from '../../types/subscription';

export default function useActiveGroup() {
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptionData, setSubscriptionData] = useState<CurrentSubscription>();

    const getPurchaseHistories = useCallback(async () => {
        setIsLoading(true);
        const data: CurrentPlanResponse | false = await getCurrentSubscription();
        if (data) {
            const { currentSubscription } = data;
            setSubscriptionData(currentSubscription);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        getPurchaseHistories();
    }, [getPurchaseHistories]);

    return {
        data: subscriptionData,
        isLoading,
    };
}
