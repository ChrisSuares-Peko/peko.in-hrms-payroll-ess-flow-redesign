import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { reimbursementUpdate } from '../../../api/employeeSalaryApi/ReimbursementApi/index';
import {
    ReimbursementRequestFormType,
    reimbursementTableType,
} from '../../../types/salaryProfileTypes/ReimbursementTypes/index';

export function useUpdateReimbursement(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const[isUpdating,setIsUpdating]=useState(false)
    const updateReimbursementId = useCallback(
        async (values: ReimbursementRequestFormType, reimbursementData: reimbursementTableType) => {
            const payload = {
                ...values,
                reimbursementId: reimbursementData.id,
                supportingDocs: values.supportingDocs
                    ? {
                          base64: values.supportingDocs,
                          format: values.supportingDocs,
                      }
                    : reimbursementData.supportingDocs,
            };
            setIsUpdating(true)
            const data = await reimbursementUpdate({
                ...payload,
                userId: id,
                userType: role,
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
            setIsUpdating(false)
        },
        [id, role, handleCancel, dispatch]
    );
    return { updateReimbursementId ,isUpdating};
}
