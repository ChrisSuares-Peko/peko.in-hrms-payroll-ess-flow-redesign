import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { bonusUpdate } from '../../../api/employeeSalaryApi/bonusApi/index';
import { updateBonusPayload } from '../../../types/salaryProfileTypes/bonustypes/index';

export function useUpdateBonus(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const[isUpdating,setIsUpdating]=useState(false);
    const updateBonusById = useCallback(
        async (payload: updateBonusPayload, bonusId: string) => {
            setIsUpdating(true)
            const data = await bonusUpdate({
                ...payload,
                bId: bonusId,
                userId: id,
                userType: role,
            });
            if (data && data.data) {
                dispatch(
                    showToast({
                        description: data.message,
                        variant: 'success',
                    })
                );
                if (handleCancel) handleCancel();
            }
            setIsUpdating(false);
            return data;
        },
        [id, role, dispatch, handleCancel]
    );
    return { updateBonusById,isUpdating };
}
