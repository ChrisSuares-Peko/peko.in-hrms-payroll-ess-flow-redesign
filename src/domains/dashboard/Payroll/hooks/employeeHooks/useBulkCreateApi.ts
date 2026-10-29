import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { BulkEmployeeCreate } from '../../api/employeeApi';
import { setBulkEmployeeData } from '../../slices/jsonSlice';
import { BulkUploadCreatePayload } from '../../types/types';
import { invalidateDashboardCache } from '../dashboardHooks/useDashboardApi';
import { invalidateEmployeeCountCache } from '../dashboardHooks/useGetEmployeeCount';

export function useBulkCreateApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const BulkCreate = async (payload: BulkUploadCreatePayload) => {
        setIsLoading(true); // Set loading state to true before API call

        const response = await BulkEmployeeCreate({
            jsonData: payload.jsonData,
            userId: id,
            userType: role,
        });

        if (response?.status) {
            invalidateDashboardCache();
            invalidateEmployeeCountCache();
            dispatch(setBulkEmployeeData(response.data.jsonData));
            dispatch(showToast({ variant: 'success', description: 'Bulk upload successful' }));
            navigate('/payroll/employees');
        } else {
            dispatch(
                showToast({
                    variant: 'error',
                    description: response!.message,
                })
            );
        }

        setIsLoading(false); // Set loading state to false after API call
    };

    return { BulkCreate, isLoading };
}
