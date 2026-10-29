import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { UnfreezeRequest, requestUnfreeze } from '../../api/user/cardsApi';

export const useUnfreezeRequestApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitUnfreezeRequest = async (payload: UnfreezeRequest) => {
        setIsLoading(true);
        const res = await requestUnfreeze(role, id, payload);
        setIsLoading(false);
        return res;
    };

    return { submitUnfreezeRequest, isLoading };
};
