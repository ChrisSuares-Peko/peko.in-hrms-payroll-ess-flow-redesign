import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { plansApi } from '../api/plansApi';
import { PlansResponse, WorkPlan } from '../type/index';

export function usePlansApi(workId: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [plans, setPlans] = useState<WorkPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getPlanList = useCallback(async () => {
        const data: PlansResponse | false = await plansApi({
            userId: id,
            userType: role,
            workId,
        });
        if (data) {
            setPlans(data.data);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, workId]);

    useEffect(() => {
        getPlanList();
    }, [getPlanList]);

    return { data: plans, isLoading };
}
