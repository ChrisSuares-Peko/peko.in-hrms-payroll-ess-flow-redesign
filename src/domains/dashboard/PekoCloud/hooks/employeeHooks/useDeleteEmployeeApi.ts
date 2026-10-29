import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { employeeDelete } from '../../api/employees';

interface useReimbursementApiProps {
    handleCancel?: () => void;
}
export const useDeleteEmployeeApi = ({ handleCancel }: useReimbursementApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    useState<any>();
    const [isLoading, setIsLoading] = useState(false);

    const deleteEmployeeData = useCallback(
        async (employeeId: string) => {
            setIsLoading(true);
            const data = await employeeDelete({
                userId: id,
                userType: role,
                employeeId,
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

    return { deleteEmployeeData, isLoading };
};
