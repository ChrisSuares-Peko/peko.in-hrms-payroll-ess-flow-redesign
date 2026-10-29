import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getPrepaidPlans } from '../api/index';
import { MobilePlan, PrepaidPlansPayload, PrepaidPlansResponse } from '../types/index';

export default function usePrepaidPlans(
    setPlanModalOpen: React.Dispatch<React.SetStateAction<boolean>>
) {
    const [isLoading, setIsLoading] = useState(false);

    const [plansData, setPlansData] = useState<MobilePlan[]>([]);
    const [planCategories, setPlanCategories] = useState<string[]>([]);
    const dispatch = useAppDispatch();

    const getPlans = useCallback(
        async (payload: PrepaidPlansPayload) => {
            if (payload.serviceProvider === '' && payload.location === '') {
                dispatch(
                    showToast({
                        description: 'Please choose the provider and circle',
                        variant: 'error',
                    })
                );
                return;
            }
            setIsLoading(true);
            setPlanModalOpen(true);
            const data: PrepaidPlansResponse | false = await getPrepaidPlans(payload);
            if (data) {
                setPlansData(data.plans);
                setPlanCategories(data.planCategory);
            }
            setIsLoading(false);
        },
        [dispatch, setPlanModalOpen]
    );

    return { getPlans, plansData, planCategories, isLoading };
}
