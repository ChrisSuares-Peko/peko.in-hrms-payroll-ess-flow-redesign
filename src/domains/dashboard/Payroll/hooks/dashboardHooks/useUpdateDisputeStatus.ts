import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateDisputeStatus } from '../../api/dashBoardIndex';

export function useUpdateDisputeStatus(onSuccess: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const review = useCallback(async (disputeId: string, status: 'approved' | 'rejected', remarks?: string) => {
        setIsLoading(true);
        const result = await updateDisputeStatus({ userType: role, userId: id, disputeId, status, remarks });
        if (result.success) {
            dispatch(showToast({ description: `Dispute ${status} successfully`, variant: 'success' }));
            onSuccess();
        } else {
            dispatch(showToast({ description: result.errorMessage ?? 'Failed to update dispute', variant: 'error' }));
        }
        setIsLoading(false);
    }, [role, id, dispatch, onSuccess]);

    return { review, isLoading };
}
