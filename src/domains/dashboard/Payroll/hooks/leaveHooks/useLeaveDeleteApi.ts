import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteLeave } from '../../api/leaveApis';

interface useDeleteLeaveApiProps {
    handleCancel?: () => void;
}

export const useDeleteLeaveApi = ({ handleCancel }: useDeleteLeaveApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();
    const deleteLeaveData = useCallback(
        async (rId: string) => {
            console.log("rid",rId)
            setIsLoading(true);
            try {
                const data = await deleteLeave({
                    userId: id,
                    userType: role,
                    rId,
                });

                if (data && data.status) {
                    dispatch(showToast({ variant: 'success', description: data.message }));

                    if (handleCancel) {
                        handleCancel();
                    }
                    return true;
                }
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Failed to delete the leave.Please try again',
                    })
                );
                return false;
            } catch (error) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Failed to delete the leave.Please try again',
                    })
                );
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [dispatch, handleCancel, id, role]
    );

    return { deleteLeaveData, isLoading };
};
