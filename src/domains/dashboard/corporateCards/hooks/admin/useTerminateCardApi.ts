import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { terminateCard } from '../../api/admin/requestsApi';

export const useTerminateCardApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitTerminate = async (cardIssuanceId: number, reason?: string) => {
        setIsLoading(true);
        const res = await terminateCard(role, id, cardIssuanceId, reason);
        setIsLoading(false);
        return res;
    };

    return { submitTerminate, isLoading };
};
