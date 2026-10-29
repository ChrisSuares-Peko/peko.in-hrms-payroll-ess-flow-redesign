import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { employeeUpdate } from '../../api/employees';

export function useUpdateEmployee(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const updateEmployee = async (values: any, employeeId: number) => {
        setSubmitLoading(true);

        const payload = {
            ...values,
            employeeId,
            profilePicture: values.profilePicture.profileImageFormat
                ? {
                      profileImageBase: values.profileImageBase,
                      profileImageFormat: values.profileImageFormat,
                  }
                : values.profilePicture,
            userId: id,
            userType: role,
        };

        const data = await employeeUpdate(payload);
        if (data && data.data) {
            dispatch(
                showToast({
                    description: data.message,
                    variant: 'success',
                })
            );
            if (handleCancel) {
                handleCancel();
            }
        }
        setSubmitLoading(false);
    };

    return { updateEmployee, submitLoading };
}
