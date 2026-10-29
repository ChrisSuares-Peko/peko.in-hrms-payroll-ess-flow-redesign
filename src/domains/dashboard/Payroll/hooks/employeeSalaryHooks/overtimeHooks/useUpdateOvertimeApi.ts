import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { overtimeUpdate } from '../../../api/employeeSalaryApi/overtimeApi';
import {
    createOvertimePayload,
    overtimeTable,
} from '../../../types/salaryProfileTypes/overtimeTypes';

export function useUpdateOvertime() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const[isUpdating,setIsUpdating]=useState(false)
    const dispatch = useAppDispatch();

    const updateOvertimeId = async (
        payload: createOvertimePayload,
        selectedRowData: overtimeTable
    ) => {
        setIsUpdating(true);
        const data = await overtimeUpdate({
            ...payload,
            overtimeId: selectedRowData.id,
            userId: id,
            userType: role,
        });
        if (data) {
            dispatch(
                showToast({
                    description: 'Overtime updated succesfully',
                    variant: 'success',
                })
            );
        }
        setIsUpdating(false);
    };

    return { updateOvertimeId,isUpdating };
}
