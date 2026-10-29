import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addLeave } from '../../api/leaveApis';
import { LeaveRequestFormType } from '../../types/leaveSection';


export function useAddLeave(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isAddLoading, setIsAddLoading] = useState(false);

    const dispatch = useAppDispatch();
    const addLeaveData = useCallback(
        async (values: LeaveRequestFormType) => {
            const payload = {
                ...values,
                leaveSupportingDocs: values.leaveSupportingDocs
                    ? {
                          base64: values.leaveSupportingDocs,
                          format: values.supportingDocFormat,
                      }
                    : null,
            };
            setIsAddLoading(true);
            const data = await addLeave({
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
            setIsAddLoading(false);
            return data;
        },
        [id, role, dispatch, handleCancel]
    );
    return { addLeaveData ,isAddLoading};
}
