import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateOvertimeStatus } from '../../api/dashBoardIndex';

export function useUpdateOvertimeStatus(onSuccess: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const update = useCallback(async ({
        overtimeId,
        status,
        notes,
    }: {
        overtimeId: string;
        status: 'approved' | 'rejected';
        notes?: string;
    }) => {
        setIsLoading(true);
        const result = await updateOvertimeStatus({ userType: role, userId: id, overtimeId, status, notes });
        if (result.success) {
            dispatch(showToast({ description: `Overtime ${status} successfully`, variant: 'success' }));
            onSuccess();
        } else {
            dispatch(showToast({ description: (result as any).errorMessage ?? 'Failed to update overtime', variant: 'error' }));
        }
        setIsLoading(false);
    }, [role, id, dispatch, onSuccess]);

    return { update, isLoading };
}
