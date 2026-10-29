import { useCallback, useEffect, useState } from 'react';

import { cancelSubscriptionPlanPatch, fetchPekoPlusDetails } from '../api';
import { SubscriptionDetailsResponse } from '../types';

const useSubscriptionDetails = () => {
    const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetailsResponse>({
        isPurchased: false,
        previousSubscription: null,
    });

    const [isLoader, setIsLoader] = useState(false);

    const getPekoPlusDetails = useCallback(async () => {
        const resp = await fetchPekoPlusDetails();
        if (resp) {
            setSubscriptionDetails(resp);
        }
    }, []);

    useEffect(() => {
        getPekoPlusDetails();
    }, [getPekoPlusDetails]);

    const handleCancelSubscriptionPlan = useCallback(
        async (subscriptionId: number) => {
            setIsLoader(true);
            const data: { message: string } | false =
                await cancelSubscriptionPlanPatch(subscriptionId);
            setIsLoader(false);
            if (data) {
                await getPekoPlusDetails();
                return true;
            }
            return false;
        },
        [getPekoPlusDetails]
    );

    return {
        subscriptionDetails,
        handleCancelSubscriptionPlan,
        isLoader,
    };
};

export default useSubscriptionDetails;
