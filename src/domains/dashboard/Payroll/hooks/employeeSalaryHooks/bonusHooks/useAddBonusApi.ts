import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createBonus } from '../../../api/employeeSalaryApi/bonusApi/index';
import { createBonusPayload } from '../../../types/salaryProfileTypes/bonustypes/index';

export default function useBonusCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const[isAdding,setIsAdding]=useState(false);

    const handleBonusCreation = useCallback(
        async (payload: createBonusPayload) => {
            setIsAdding(true);
            const data = await createBonus({
                ...payload,
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
            setIsAdding(false);
            return data;
        },
        [id, role, dispatch, handleCancel]
    );
    return { handleBonusCreation ,isAdding};
}
