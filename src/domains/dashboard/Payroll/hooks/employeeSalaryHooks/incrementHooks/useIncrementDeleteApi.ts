import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteIncrement } from '../../../api/employeeSalaryApi/incrementApi/index';

interface useDeleteIncrementApiProps {
    handleCancel?: () => void;
}
export const useDeleteIncrementApi = ({ handleCancel }: useDeleteIncrementApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const deleteIncrementData = useCallback(
        async (rId: string) => {
            setIsLoading(true);

            const data = await deleteIncrement({
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
        },
        [dispatch, handleCancel, id, role]
    );
    return { deleteIncrementData, isLoading };
};
