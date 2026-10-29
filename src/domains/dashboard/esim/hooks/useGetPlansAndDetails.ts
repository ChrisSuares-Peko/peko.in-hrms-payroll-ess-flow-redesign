import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPlansAndDetails } from '../api/index';
import { getPlanDetailsResponse } from '../types/TopUp';

export default function useGetPlansAndDetails(planId: string, country?: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [plans, setPlans] = useState<getPlanDetailsResponse>();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const getPlansDetails = useCallback(async () => {
        setIsLoading(true);
        const data: getPlanDetailsResponse | false = await getPlansAndDetails({
            userId: id,
            userType: role,
            planId,
            country,
        });

        if (data && data.length) {
            setPlans(data);
        }
        setIsLoading(false);
    }, [planId, id, role, country]);

    useEffect(() => {
        getPlansDetails();
    }, [getPlansDetails]);

    return { plans, isLoading };
}
