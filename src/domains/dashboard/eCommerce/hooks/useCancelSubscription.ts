import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { cancelBilling } from '../api';

export function useCancelSubscription() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const cancelSubscription = async (subscriptionId: number) => {
        setIsLoading(true);
        const response = await cancelBilling({
            userId: id,
            userType: role,
            subscriptionId,
        });
        setIsLoading(false);
        return Boolean(response);
    };

    return { cancelSubscription, isLoading };
}
