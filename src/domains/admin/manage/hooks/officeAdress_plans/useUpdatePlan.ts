import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createPlan, putUpdatePlan } from '../../api/plans';
import { PlanBody, PlanWithoutID } from '../../types/plans';

export default function useUpdatePlan() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<PlanBody | {}>();
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handlePlanCreation = async (payload: PlanWithoutID) => {
        setIsLoading(true);
        const response: false | PlanBody = await createPlan({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response) {
            dispatch(showToast({ description: `Plan created successfully`, variant: 'success' }));
            setResponseData(response);
        }
        setIsLoading(false);
        return response;
    };

    const updatePlanDetails = useCallback(
        async (vendorUpdatedData: PlanBody) => {
            setIsLoading(true);
            const response: {} | false = await putUpdatePlan({
                userId: id,
                userType: role,
                ...vendorUpdatedData,
            });
            if (response) {
                dispatch(
                    showToast({ description: `Plan updated successfully`, variant: 'success' })
                );
                setResponseData(response);
            }
            setIsLoading(false);
            return response;
        },
        [dispatch, id, role]
    );

    return { handlePlanCreation, responseData, isLoading, updatePlanDetails };
}
