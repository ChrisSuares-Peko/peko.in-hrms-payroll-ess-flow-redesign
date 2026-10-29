import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateDeduction } from '../../../api/employeeSalaryApi/deductionApi/index';
import {
    DeductionEditFormType,
    deductionTableType,
} from '../../../types/salaryProfileTypes/deductionTypes/index';

export function useUpdateDeduction(handleCancel: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const deductionUpdate = async (
        values: DeductionEditFormType,
        deductionData: deductionTableType,
        employeeId: string
    ) => {
        const data = await updateDeduction({
            deductionFor: values.deductionFor,
            note: values.note?.trim() ?? '',
            amount: Number(values.amount),
            employeeId,
            id: deductionData.id,
            userId: id,
            userType: role,
        });
        if (data) {
            handleCancel();
            dispatch(
                showToast({
                    description: 'Deduction updated successfully',
                    variant: 'success',
                })
            );
        }
    };

    return { deductionUpdate };
}
