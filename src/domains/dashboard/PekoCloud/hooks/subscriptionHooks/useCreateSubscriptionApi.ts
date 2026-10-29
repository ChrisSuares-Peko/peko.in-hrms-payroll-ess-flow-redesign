import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createSubscription } from '../../api/subscriptions';

export default function useSubscriptionCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);
    const handleCreateSubscription = async (values: any) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            numberOfDevices: values.numberOfUsers || null,
            userId: id,
            userType: role,
        };

        delete payload.numberOfUsers;

        const data = await createSubscription(payload);
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
        return data;
    };

    return { handleCreateSubscription, submitLoading };
}
