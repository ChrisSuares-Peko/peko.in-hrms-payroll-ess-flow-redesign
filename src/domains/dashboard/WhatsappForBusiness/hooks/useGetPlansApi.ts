import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPlanDetails } from '../api/index';
import { PlanDetailsResponse } from '../types/types';

export default function GetAllPlans() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [planDetails, setPlanDetails] = useState<PlanDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);

    const getPlanInfo = useCallback(async () => {
        const data: PlanDetailsResponse | false = await getPlanDetails({
            userId: id,
            userType: role,
        });
        if (data) {
            const planDetailData = data as PlanDetailsResponse;
            setPlanDetails(planDetailData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getPlanInfo();
    }, [getPlanInfo]);

    return { planData: planDetails, isLoading };
}
