import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateSalaryRolloutEmployee } from '../../../api/employeeSalaryApi/salaryRolloutApi';
import { UpdateSalaryRolloutEmployeePayload } from '../../../types/salaryProfileTypes/salaryRolloutTypes';

type UpdateFields = Omit<UpdateSalaryRolloutEmployeePayload, 'userId' | 'userType' | 'employeeId'>;

type ApiResponse = { status: boolean; message: string; data: any } | false;

export const useUpdateSalaryRolloutEmployee = (onSuccess: () => void) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const update = async (employeeId: string, fields: UpdateFields) => {
        setIsSubmitting(true);
        const result = await updateSalaryRolloutEmployee({
            userId: String(id),
            userType: role,
            employeeId,
            ...fields,
        }) as ApiResponse;
        setIsSubmitting(false);
        if (result && result.status) {
            dispatch(showToast({ variant: 'success', description: result.message ?? 'Employee bank details updated successfully.' }));
            onSuccess();
        }
        return result;
    };

    return { update, isSubmitting };
};
