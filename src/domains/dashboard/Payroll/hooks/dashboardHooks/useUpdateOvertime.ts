import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateOvertime } from '../../api/dashBoardIndex';

export type UpdateOvertimeArgs = {
    overtimeId: string;
    overTimeDate: string;
    extraHours: number;
    overTimeRate: string;
    totalWorkingHours: number;
    hourlyRate: string;
    overTimeAmount: string;
    notes?: string;
};

export function useUpdateOvertime(onSuccess: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const update = useCallback(async (args: UpdateOvertimeArgs) => {
        setIsLoading(true);
        const result = await updateOvertime({ userType: role, userId: id, ...args });
        if (result.success) {
            dispatch(showToast({ description: 'Overtime updated successfully', variant: 'success' }));
            onSuccess();
        }
        setIsLoading(false);
    }, [role, id, dispatch, onSuccess]);

    return { update, isLoading };
}
