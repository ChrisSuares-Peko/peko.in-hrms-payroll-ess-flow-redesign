import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { activatePekoPlus } from '../api/globalBusinessSetup';

interface ActivatePayload {
    planId: number;
}

export const useActivatePekoPlus = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();

    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    const activate = async (payload: ActivatePayload): Promise<any | null> => {
        if (!payload.planId) {
            dispatch(
                showToast({
                    description: 'Invalid subscription plan',
                    variant: 'error',
                })
            );
            return null;
        }

        try {
            setLoading(true);

            const res = await activatePekoPlus({
                userId,
                userType,
                planId: payload.planId,
            });

            return res ?? null;
        } catch (err) {
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        activate,
        loading,
    };
};
