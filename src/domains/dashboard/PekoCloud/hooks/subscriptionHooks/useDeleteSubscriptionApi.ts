import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteSubscription } from '../../api/subscriptions';

interface UseSubscriptionApiProps {
    handleCancel?: () => void;
}

export const useDeleteSubscriptionApi = ({ handleCancel }: UseSubscriptionApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteSubscriptionData = async (subscriptionId: string) => {
        setIsLoading(true);
        const data = await deleteSubscription({
            userId: id,
            userType: role,
            subscriptionId,
        });
        if (data && data.data && handleCancel) {
            dispatch(
                showToast({
                    description: data.message,
                    variant: 'success',
                })
            );
            handleCancel();
        }
        setIsLoading(false);
    };

    return { deleteSubscriptionData, isLoading };
};
