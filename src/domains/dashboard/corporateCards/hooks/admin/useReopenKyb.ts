import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { reopenKyb } from '../../api/admin/kybStatusApi';
import { setKybStage } from '../../slices/corporateCardsSlice';

/**
 * Acknowledges the "KYB Rejected" screen (POST kyb-status/reopen), then moves on only on success —
 * recording it server-side is what lets a later page load return the corporate to the step they were
 * fixing instead of the rejection screen they already acted on.
 *
 * Lands on the SAME step `resolveStage` derives from the stored application, so the click and a refresh
 * cannot disagree. A wrong constitution is still reachable: the upload step's "Go Back" returns to the
 * business type.
 */
export const useReopenKyb = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { businessType } = useAppSelector(state => state.reducer.corporateCards);
    const [reopenLoading, setReopenLoading] = useState(false);

    const handleReopen = async () => {
        setReopenLoading(true);
        const res = await reopenKyb(role, id);
        setReopenLoading(false);
        if (!res) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Could not reopen your KYB. Please try again.',
                })
            );
            return;
        }
        dispatch(setKybStage(businessType ? 'upload' : 'initiate'));
    };

    return { handleReopen, reopenLoading };
};
