import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { assignSubscription } from '../../api/subscriptions';

export default function useAssignSubscription(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);
    const handleAssignSubscription = async (values: any) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            userId: id,
            userType: role,
        };

        const data = await assignSubscription(payload);
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

    return { handleAssignSubscription, submitLoading };
}
