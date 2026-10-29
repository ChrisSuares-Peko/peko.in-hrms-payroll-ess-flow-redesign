import { useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEsimPrice } from '../api/eSIM';

const useEsimPlanForm = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const fetchEsimPrice = useCallback(
        async (coverageId: string, countryIso2: string, indicator: string, label: string) => {
            setIsLoading(true);
            const data = await getEsimPrice({
                userId: id,
                userType: role,
                coverageId,
                countryIso2,
                indicator,
                label,
            });

            // Process and return the data if needed
            return data;
        },
        [id, role]
    );

    return {
        isLoading,
        fetchEsimPrice,
    };
};

export default useEsimPlanForm;
