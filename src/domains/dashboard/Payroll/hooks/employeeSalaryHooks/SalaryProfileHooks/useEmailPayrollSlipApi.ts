import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { emailPayslip } from '../../../api/employeeSalaryApi/SalaryProfileApi/index';

export default function EmailPayslipData() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    const sendEmail = useCallback(
        async (salaryId: string) => {
            setIsLoading(true);
            const data: boolean = await emailPayslip({
                userId: id,
                userType: role,
                salaryId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: `Email has been sent`,
                        variant: 'success',
                    })
                );
            } else {
                dispatch(
                    showToast({
                        description: `Some error happened while sending`,
                        variant: 'error',
                    })
                );
            }
            return setIsLoading(false);
        },
        [dispatch, id, role]
    );

    return { sendEmail, isLoading };
}
