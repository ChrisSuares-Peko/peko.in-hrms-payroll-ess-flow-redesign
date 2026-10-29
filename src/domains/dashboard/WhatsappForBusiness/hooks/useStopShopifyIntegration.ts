import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { stopShopifyIntegrationBilling } from '../api';

export function useStopShopifyIntegrationApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const stopShopifyIntegration = async (subscriptionId: number) => {
        setIsLoading(true);

        const response = await stopShopifyIntegrationBilling({
            userId: id,
            userType: role,
            id: subscriptionId,
        });

        if (response) {
            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    };
    return { stopShopifyIntegration, isLoading };
}
