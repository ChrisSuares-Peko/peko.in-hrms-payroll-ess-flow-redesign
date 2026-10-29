import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateApproveSalary } from '../../../api/employeeSalaryApi/SalaryProfileApi';
import { ApproveSalary } from '../../../types/type';
import { invalidateDashboardCache } from '../../dashboardHooks/useDashboardApi';

export function useApproveSalaryApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const updateRecordSalary = async (payload: ApproveSalary): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await updateApproveSalary({ ...payload, userId: id, userType: role });

            setIsLoading(false);

            if (response.success) {
                invalidateDashboardCache();
                dispatch(
                    showToast({
                        variant: 'success',
                        description: 'Salary approved successfully',
                    })
                );
                return true;
            }
            dispatch(
                showToast({
                    variant: 'warning',
                    description: response.errorMessage || 'Salary not approved. Please Try Again',
                })
            );
            return false;
        } catch (error) {
            dispatch(
                showToast({
                    variant: 'error',
                    description:
                        error.response?.data?.message ||
                        'An error occurred while approving the salary.',
                })
            );
            setIsLoading(false);
            return false;
        }
    };

    return { updateRecordSalary, isLoading };
}
