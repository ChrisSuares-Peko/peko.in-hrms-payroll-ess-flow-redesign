import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { updateCardStatus } from '../../api/user/cardsApi';

export const useCardStatusApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitCardStatus = async (
        cardId: string,
        status: string,
        reason?: number,
        reasonNote?: string
    ) => {
        setIsLoading(true);
        const res = await updateCardStatus(role, id, { cardId, status, reason, reasonNote });
        setIsLoading(false);
        return res;
    };

    return { submitCardStatus, isLoading };
};
