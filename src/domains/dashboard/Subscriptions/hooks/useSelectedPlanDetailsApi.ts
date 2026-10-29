import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getSingleSelectedPlanDetails } from '../api/index';
import { SelectedPlanDetailsResponse } from '../types/types';

export default function GetSingleSelectedPlanDetails(planID: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [planDetails, setPlanDetails] = useState<SelectedPlanDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const getSinglePlanDetails = useCallback(async () => {
        const data: SelectedPlanDetailsResponse | false = await getSingleSelectedPlanDetails({
            userId: id,
            userType: role,
            planId: planID,
        });
        if (data) {
            const planDetailData = data as SelectedPlanDetailsResponse;
            setPlanDetails(planDetailData);
            setIsLoading(false);
        } else {
            navigate(`/${paths.subscriptions.index}`);
            dispatch(
                showToast({
                    description: 'Product not found',
                    variant: 'error',
                })
            );
            setIsLoading(false);
        }
    }, [id, role, planID, navigate, dispatch]);

    useEffect(() => {
        getSinglePlanDetails();
    }, [getSinglePlanDetails]);

    return { data: planDetails, isLoading };
}
