import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { planDetailsApi } from '../api/planDetailsApi';
import { WorkPlan } from '../type/index';

export function usePlanDetailsApi(planId: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [works, setWorks] = useState<WorkPlan>();
    const [isLoading, setIsLoading] = useState(true);

    const getPlanDetails = useCallback(async () => {
        const data: WorkPlan | false = await planDetailsApi({
            userId: id,
            userType: role,
            planId,
        });
        if (data) {
            setWorks(data);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, planId]);

    useEffect(() => {
        getPlanDetails();
    }, [getPlanDetails]);

    return { data: works, isLoading };
}
