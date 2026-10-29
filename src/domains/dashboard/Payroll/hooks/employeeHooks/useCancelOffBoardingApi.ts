import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    cancelOffBoarding,
    CancelOffBoardingPreview,
    getCancelOffBoarding,
} from '../../api/employeeApi';

export function useCancelOffBoardingApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [preview, setPreview] = useState<CancelOffBoardingPreview | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Loads what the confirmation shows. Returns false (after a toast with the reason) when the
    // offboarding can no longer be cancelled.
    const loadPreview = useCallback(
        async (employeeId: string) => {
            setIsLoadingPreview(true);
            setPreview(null);
            const res = await getCancelOffBoarding({ userId: id, userType: role, employeeId });
            setIsLoadingPreview(false);
            if (!res.success) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: res.errorMessage || 'This offboarding can no longer be cancelled.',
                    })
                );
                return false;
            }
            setPreview(res.data);
            return true;
        },
        [dispatch, id, role]
    );

    const cancel = async (employeeId: string, reason?: string) => {
        setIsCancelling(true);
        const res = await cancelOffBoarding({
            userId: id,
            userType: role,
            employeeId,
            reason: reason?.trim() || undefined,
        });
        setIsCancelling(false);
        dispatch(
            showToast(
                res.success
                    ? { variant: 'success', description: res.message || 'Offboarding cancelled.' }
                    : {
                          variant: 'error',
                          description: res.errorMessage || 'Failed to cancel the offboarding. Please try again.',
                      }
            )
        );
        return res.success;
    };

    return { preview, loadPreview, isLoadingPreview, cancel, isCancelling };
}
