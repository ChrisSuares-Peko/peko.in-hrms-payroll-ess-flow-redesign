import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteOvertime } from '../../../api/employeeSalaryApi/overtimeApi';
import { overtimeDeletedResponse } from '../../../types/salaryProfileTypes/overtimeTypes';

interface useDeleteOvertimeApiProps {
    handleCancel: () => void;
}

export const useDeleteOvertimeApi = ({ handleCancel }: useDeleteOvertimeApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const deleteOvertimeData = async (rId: string) => {
        setIsLoading(true);
        const data: overtimeDeletedResponse | false = await deleteOvertime({
            userId: id,
            userType: role,
            rId,
        });
        if (data) {
            dispatch(
                showToast({
                    description: 'Overtime deleted successfully',
                    variant: 'success',
                })
            );
            handleCancel();
        }
        setIsLoading(false);
    };

    return { deleteOvertimeData, isLoading };
};
