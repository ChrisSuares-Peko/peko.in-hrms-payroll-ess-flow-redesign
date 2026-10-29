import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { stopBotBuilderBilling } from '../api';

export function useStopBotBuilderApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const stopBotBuilder = async (subscriptionId: number) => {
        setIsLoading(true);

        const response = await stopBotBuilderBilling({
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
    return { stopBotBuilder, isLoading };
}
