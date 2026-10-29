import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { ExportEmployeeData } from '../../api/employeeApi';
import { exportEmployeeDataResponse } from '../../types/types';

export default function useDownloadEmployeeData() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(true);

    const downloadEmployeeDetails = useCallback(
        async (employeeStatus:string) => {
            setIsLoading(true);
            try {
                const data: exportEmployeeDataResponse | false = await ExportEmployeeData({
                    userId: id,
                    userType: role,
                    employeeStatus
                    
                });
                if (data) {
                    return data; // Returning the data for the caller to handle
                }
                dispatch(showToast({ variant: 'error', description: 'No employees found' }));
                return false;
            } catch (error) {
                dispatch(
                    showToast({ variant: 'error', description: 'Failed to fetch employee data' })
                );
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [id, role, dispatch]
    );

    return { downloadEmployeeDetails, isLoading };
}
