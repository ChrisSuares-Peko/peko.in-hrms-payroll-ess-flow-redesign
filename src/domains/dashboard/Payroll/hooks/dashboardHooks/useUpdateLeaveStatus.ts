import { useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateLeaveStatus } from '../../api/dashBoardIndex';

type UpdateArgs = {
    leaveId: string;
    status: string;
    notes?: string;
};

export function useUpdateLeaveStatus(onSuccess?: () => void) {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const update = async ({ leaveId, status, notes }: UpdateArgs) => {
        setIsLoading(true);
        const result = await updateLeaveStatus({ userType: role, userId: id, leaveId, status, notes });
        setIsLoading(false);
        if (result.success) {
            dispatch(showToast({ description: 'Leave status updated successfully', variant: 'success' }));
            onSuccess?.();
        } else {
            dispatch(showToast({ description: result.errorMessage ?? 'Failed to update leave status', variant: 'error' }));
        }
        return result;
    };

    return { update, isLoading };
}
