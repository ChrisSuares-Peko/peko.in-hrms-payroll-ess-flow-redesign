import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { completeKyb } from '../../api/admin/kybStatusApi';
import { setKybStage } from '../../slices/corporateCardsSlice';

/**
 * Acknowledges the "KYB Verified" screen (POST kyb-status/complete), then dispatches
 * setKybStage('complete') only on success — this persists the transition server-side so a page
 * refresh reflects COMPLETED instead of re-showing the verified screen.
 */
export const useCompleteKyb = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [completeLoading, setCompleteLoading] = useState(false);

    const handleComplete = async () => {
        setCompleteLoading(true);
        const res = await completeKyb(role, id);
        setCompleteLoading(false);
        if (!res) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Failed to continue. Please try again.',
                })
            );
            return;
        }
        dispatch(setKybStage('complete'));
    };

    return { handleComplete, completeLoading };
};
