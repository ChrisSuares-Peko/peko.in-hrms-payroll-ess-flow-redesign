import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createIncrement } from '../../../api/employeeSalaryApi/incrementApi/index';

export default function useIncrementCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const handleIncrementCreation = async (values: any) => {
        const amount =
            values.incrementType === 'flat' ? values.incrementAmount : values.incrementPercentage;

        const payload = {
            employeeId: values.employeeId,
            basicSalary: values.basicSalary,
            incrementType: values.incrementType,
            newBasicSalary: values.newBasicSalary,
            effectiveDate: values.effectiveDate,
            amount,
            attachment: values.attachment
                ? {
                      base64: values.attachment,
                      format: values.attachmentFormat,
                  }
                : null,

            userId: id,
            userType: role,
        };

        const data = await createIncrement(payload);

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
    };

    return { handleIncrementCreation };
}
