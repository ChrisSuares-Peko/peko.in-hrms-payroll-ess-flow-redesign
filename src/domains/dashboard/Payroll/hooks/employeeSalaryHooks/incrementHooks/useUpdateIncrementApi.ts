import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { incrementUpdate } from '../../../api/employeeSalaryApi/incrementApi/index';
import { updateIncrementPayload } from '../../../types/salaryProfileTypes/incrementTypes/index';

export function useUpdateIncrement(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const updateIncrementId = useCallback(
        async (values: updateIncrementPayload, incrementData: any) => {
            const amount =
                values.incrementType === 'flat'
                    ? values.incrementAmount
                    : values.incrementPercentage;

            const payload = {
                employeeId: values.employeeId,
                basicSalary: values.basicSalary,
                incrementType: values.incrementType,
                newBasicSalary: values.newBasicSalary,
                effectiveDate: values.effectiveDate,
                amount,
                incrementId: incrementData.id,
                attachment: values.attachment
                    ? {
                          base64: values.attachment,
                          format: values.attachmentFormat,
                      }
                    : incrementData.attachment,
                userId: id,
                userType: role,
            };

            const data = await incrementUpdate(payload);

            if (data && data.data) {
                dispatch(
                    showToast({
                        description: data.message,
                        variant: 'success',
                    })
                );
                if (handleCancel) handleCancel();
            }

            return data;
        },
        [id, role, dispatch, handleCancel]
    );

    return { updateIncrementId };
}
