import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteBonus } from '../../../api/employeeSalaryApi/bonusApi/index';

interface useDeleteBonusApiProps {
    handleCancel?: () => void;
}
export const useDeleteBonusApi = ({ handleCancel }: useDeleteBonusApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const deleteBonusData = useCallback(
        async (rId: string) => {
            setIsLoading(true);
            const data = await deleteBonus({
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
    return { deleteBonusData, isLoading };
};
