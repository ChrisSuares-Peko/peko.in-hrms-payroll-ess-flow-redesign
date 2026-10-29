import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateSubscription } from '../../api/subscriptions';

export function useUpdateSubscription(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleUpdateSubscription = async (values: any, subscriptionId: number) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            subscriptionId,
            numberOfDevices: values.numberOfUsers || null,
            userId: id,
            userType: role,
        };
        delete payload.numberOfUsers;
        const data = await updateSubscription(payload);
        if (data && data.data) {
            dispatch(
                showToast({
                    description: data.message,
                    variant: 'success',
                })
            );
            if (handleCancel) {
                handleCancel();
            }
        }
        setSubmitLoading(false);
    };

    return { handleUpdateSubscription, submitLoading };
}
