import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { LimitIncreaseRequest, requestLimitIncrease } from '../../api/user/cardsApi';

export const useLimitIncreaseApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitLimitIncrease = async (payload: LimitIncreaseRequest) => {
        setIsLoading(true);
        const res = await requestLimitIncrease(role, id, payload);
        setIsLoading(false);
        return res;
    };

    return { submitLimitIncrease, isLoading };
};
