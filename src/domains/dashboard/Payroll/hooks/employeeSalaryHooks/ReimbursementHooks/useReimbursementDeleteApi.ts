import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteReimbursement } from '../../../api/employeeSalaryApi/ReimbursementApi/index';
import { reimbursementDeletedResponse } from '../../../types/salaryProfileTypes/ReimbursementTypes/index';

interface useReimbursementApiProps {
    handleCancel?: () => void;
}
export const useDeleteReimbursementApi = ({ handleCancel }: useReimbursementApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    useState<reimbursementDeletedResponse>();
    const [isLoading, setIsLoading] = useState(false);

    const deleteReimbursementData = useCallback(
        async (rId: string) => {
            setIsLoading(true);
            const data = await deleteReimbursement({
                userId: id,
                userType: role,
                rId,
            });
            if (data && data.data && handleCancel) {
                dispatch(
                    showToast({
                        description: data.message,
                        variant: 'success',
                    })
                );
                handleCancel();
            }
            setIsLoading(false);
            return data;
        },
        [dispatch, handleCancel, id, role]
    );

    return { deleteReimbursementData, isLoading };
};
