import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllPlans, getPlan } from '../api/index';
import { PlansListResponse } from '../types/index';

interface usePlansApiProps {
    initialLoading: boolean;
}
export default function usePlansApi({ initialLoading = false }: usePlansApiProps) {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [plans, setPlans] = useState<PlansListResponse>();
    const [isLoading, setIsLoading] = useState(true);

    const getPlans = useCallback(async () => {
        const resp: PlansListResponse | false = await getAllPlans({ userId: id, userType: role });
        if (resp) {
            setPlans(resp);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [role, id]);

    const getPlanById = useCallback(
        async (planId: number) => {
            setIsLoading(true);
            const resp = await getPlan({ userId: id, userType: role }, planId);
            if (resp) {
                setIsLoading(false);
                return resp;
            }
            setIsLoading(false);
            return undefined;
        },
        [id, role]
    );

    useEffect(() => {
        if (initialLoading) getPlans();
    }, [getPlans, initialLoading]);

    return { plans, isLoading, getPlanById };
}
