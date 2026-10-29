import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { PhysicalCardRequest, requestPhysicalCard } from '../../api/user/cardsApi';

export const useRequestPhysicalCardApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitRequestPhysicalCard = async (payload: PhysicalCardRequest) => {
        setIsLoading(true);
        const res = await requestPhysicalCard(role, id, payload);
        setIsLoading(false);
        return res;
    };

    return { submitRequestPhysicalCard, isLoading };
};
