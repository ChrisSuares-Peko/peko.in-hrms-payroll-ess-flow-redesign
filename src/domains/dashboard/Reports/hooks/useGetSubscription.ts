import { useState, useCallback, useEffect } from 'react';

import { subscriptionListing } from '../api/index';
import { subscriptionListingResponse, filterOption } from '../types/index';

export const useGetSubscription = () => {
    const [subscriptionData, setSubscriptionData] = useState<filterOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getSubscriptionList = useCallback(async () => {
        const data: subscriptionListingResponse | false = await subscriptionListing();
        if (data) {
            const { subscription } = data;
            setSubscriptionData(subscription);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        getSubscriptionList();
    }, [getSubscriptionList]);

    return { subscription: subscriptionData, subscriptionLoader: isLoading };
};
