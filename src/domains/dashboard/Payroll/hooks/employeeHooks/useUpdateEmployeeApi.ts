import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateEmployee } from '../../api/employeeApi';
import { UpdatePayload } from '../../types/types';

export function useUpdateEmployeeApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();
    const updateUser = async (payload: UpdatePayload) => {
        setIsLoading(true);
        try {
            const response = await updateEmployee({ ...payload, userId: id, userType: role });

            if (response) {
                dispatch(
                    showToast({
                        variant: 'success',
                        description: 'Employee Details Updated Successfully',
                    })
                );
            } else {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Employee Details Not Updated. Please Try Again',
                    })
                );
            }
        } catch (error) {
            // Handle error (e.g., show an error message)
        }
        setIsLoading(false);
    };
    return { updateUser, isLoading };
}
