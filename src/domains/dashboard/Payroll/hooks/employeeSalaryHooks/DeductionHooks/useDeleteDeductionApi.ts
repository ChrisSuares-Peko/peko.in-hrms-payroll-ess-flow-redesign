import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteDeduction } from '../../../api/employeeSalaryApi/deductionApi/index';

interface useDeleteDeductionApiProps {
    handleCancel?: () => void;
}
export function useDeleteDeduction({ handleCancel }: useDeleteDeductionApiProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [deductionDetails, setDeductionDetails] = useState<any>();
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const deductionDelete = async (deductionId: string, eId: string) => {
        setIsLoading(true);
        const data = await deleteDeduction({
            userId: id,
            userType: role,
            deductionId,
            eId,
        });
        if (data && handleCancel) {
            handleCancel();
            setDeductionDetails(data);
            dispatch(
                showToast({
                    description: 'Deduction deleted successfully',
                    variant: 'success',
                })
            );
        }
        setIsLoading(false);
    };

    return { deductionDelete, deductionDetails, isLoading };
}
