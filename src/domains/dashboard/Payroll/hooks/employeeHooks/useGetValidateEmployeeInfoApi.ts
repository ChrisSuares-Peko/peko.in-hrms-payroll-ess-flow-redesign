import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { validateEmployeeInformation } from '../../api/employeeApi';
import { validateEmployeeInformationPayload } from '../../types/type';

export function useValidateEmployeeApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useAppDispatch();

    const validateEmployee = async (payload: validateEmployeeInformationPayload) => {
        setIsLoading(true);
        try {
            const response = await validateEmployeeInformation({
                ...payload,
                userId: id,
                userType: role,
            });

            if (response.data?.status) {
                return response;
            }

            dispatch(
                showToast({
                    variant: 'error',
                    description: response?.data?.message || response.errorMessage,
                })
            );

            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { validateEmployee, isLoading };
}
