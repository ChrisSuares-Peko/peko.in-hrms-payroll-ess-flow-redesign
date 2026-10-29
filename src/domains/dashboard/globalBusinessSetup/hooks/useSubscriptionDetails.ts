import { useCallback, useEffect, useState } from 'react';

import { fetchPekoPlusDetails } from '../api/globalBusinessSetup';

const useSubscriptionDetails = () => {
    const [subscriptionDetails, setSubscriptionDetails] = useState<any>({
        isPurchased: false,
        previousSubscription: null,
    });

    const [isLoading, setIsLoading] = useState(true);

    const getPekoPlusDetails = useCallback(async () => {
        setIsLoading(true);
        const resp = await fetchPekoPlusDetails();

        if (resp) {
            setSubscriptionDetails(resp);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        getPekoPlusDetails();
    }, [getPekoPlusDetails]);

    return {
        subscriptionDetails,
        isLoading,
        refetch: getPekoPlusDetails,
    };
};

export default useSubscriptionDetails;
