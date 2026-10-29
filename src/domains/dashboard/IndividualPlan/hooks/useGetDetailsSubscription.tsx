import { useCallback, useEffect, useState } from 'react';

import { getPurchaseDetailsApi } from '../api';
import { SubscriptionDetailsResponse } from '../types';

export function useGetDetailsSubscription(accessKey: string, serviceAccessKey?: string) {
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionDetailsResponse | null>(
        null
    );

    const [isLoading, setIsLoading] = useState(true);

    const getSubscriptionData = useCallback(async () => {
        setIsLoading(true);
        const resp: SubscriptionDetailsResponse | false = await getPurchaseDetailsApi(
            accessKey,
            serviceAccessKey
        );
        if (resp) {
            setSubscriptionData(resp);
            sessionStorage.setItem(
                'subscriptionDetails',
                JSON.stringify({ isPurchased: resp.isPurchased })
            );
        }
        setIsLoading(false);
    }, [accessKey, serviceAccessKey]);

    useEffect(() => {
        getSubscriptionData();
        return () => {
            sessionStorage.removeItem('subscriptionDetails');
        };
    }, [getSubscriptionData]);

    const dismissSubscriptionLanding = useCallback(() => {
        setSubscriptionData(prev => (prev ? { ...prev, showSubscriptionLanding: false } : prev));
    }, []);

    return { isLoading, subscriptionData, dismissSubscriptionLanding };
}
