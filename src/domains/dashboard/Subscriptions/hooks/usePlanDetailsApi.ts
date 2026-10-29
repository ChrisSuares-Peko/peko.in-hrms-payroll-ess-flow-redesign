import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPlanDetails } from '../api/index';
import { PlanDetailsResponse, PlanDetailsTable } from '../types/types';

export default function GetPlanDetails(subscriptionID: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [planDetails, setPlanDetails] = useState<PlanDetailsTable>();
    const [isLoaded, setIsLoaded] = useState(true);

    const getPlansDetails = useCallback(async () => {
        const planData: PlanDetailsResponse | false = await getPlanDetails({
            userId: id,
            userType: role,
            subscriptionID,
        });

        if (planData) {
            const planDataDetails = planData as PlanDetailsResponse;
            const arr = planDataDetails?.planDatas.map(planDetail => ({
                id: planDetail.id ?? '',
                title: planDetail.name ?? '',
                period: planDetail.validity ?? '',
                amount: planDetail.price ?? '',
                monthlyCost: planDetail.subscriptionType ?? '',
                features: planDetail.features ?? '',
                noOfUsers: planDetail.noOfUsers ?? 0,
            }));
            setPlanDetails(arr);
            setIsLoaded(false);
        } else {
            setIsLoaded(false);
        }
    }, [id, role, subscriptionID]);

    useEffect(() => {
        getPlansDetails();
    }, [getPlansDetails]);

    return { planData: planDetails, planLoader: isLoaded };
}
