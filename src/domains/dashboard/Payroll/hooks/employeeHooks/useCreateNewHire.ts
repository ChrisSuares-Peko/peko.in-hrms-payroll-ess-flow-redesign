import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createNewHireEmployee } from '../../api/employeeApi';

export function useCreateNewHire() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Success feedback is deliberately NOT shown here — creating the Employee document is
    // only step one of AddNewHire.tsx's handleFinalSubmit; deductions and the initial CTC
    // (reviseSalaryApi, which can legitimately reject an infeasible CTC) still have to
    // happen afterward. Declaring "New hire added successfully" this early is exactly what
    // let a rejected CTC look like a clean success — the caller now owns success/failure
    // once the whole sequence is known to have worked (see SalaryInfo.tsx's identical fix).
    const submitNewHire = async (payload: Record<string, any>) => {
        setIsSubmitting(true);
        const result = await createNewHireEmployee({
            userId: id,
            userType: role,
            ...payload,
        });
        setIsSubmitting(false);
        if (!result.success) {
            dispatch(
                showToast({
                    description: result.errorMessage ?? 'Failed to add new hire. Please try again.',
                    variant: 'error',
                })
            );
        }
        return result;
    };

    return { submitNewHire, isSubmitting };
}
