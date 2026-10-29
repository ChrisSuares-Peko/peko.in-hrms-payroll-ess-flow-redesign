import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { confirmEmployeeProbation, extendEmployeeProbation } from '../../api/employeeApi';

export function useProbationActionsApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isSaving, setIsSaving] = useState(false);

    const toastResult = (res: { success: boolean; message?: string; errorMessage?: string }, fallback: string) => {
        dispatch(
            showToast(
                res.success
                    ? { variant: 'success', description: res.message || fallback }
                    : { variant: 'error', description: res.errorMessage || 'Something went wrong. Please try again.' }
            )
        );
        return res.success;
    };

    const confirm = async (employeeId: string) => {
        setIsSaving(true);
        const res = await confirmEmployeeProbation({ userId: id, userType: role, employeeId });
        setIsSaving(false);
        return toastResult(res, 'Employee confirmed.');
    };

    const extend = async (employeeId: string, months: number, reason: string) => {
        setIsSaving(true);
        const res = await extendEmployeeProbation({ userId: id, userType: role, employeeId, months, reason });
        setIsSaving(false);
        return toastResult(res, 'Probation extended.');
    };

    return { confirm, extend, isSaving };
}
