import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { BulkEmployeeUpload } from '../../api/employeeApi';
import { setBulkEmployeeData } from '../../slices/jsonSlice';
import { BulkEmployeeUploadResponse, BulkUploadPayload } from '../../types/types';

export function useBulkUploadApi() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [isresponse, setResponse] = useState<BulkEmployeeUploadResponse>();
    const [count, setCount] = useState<string | 0>();

    const BulkUpload = async (payload: BulkUploadPayload) => {
        setIsLoading(true);
        try {
            const response = await BulkEmployeeUpload({ ...payload, userId: id, userType: role });

            if (response) {
                setCount(response.CountOfDocs || 0);
                setResponse(response);

                dispatch(setBulkEmployeeData(response.jsonData));

                dispatch(
                    showToast({ variant: 'success', description: 'Please review the records' })
                );
                // navigate(paths.payroll.bulkUpload);
                navigate('/payroll/employees/bulk-upload');
            }
        } catch (error) {
            // Handle error (e.g., show an error message)
        }
        setIsLoading(false);
    };

    return { BulkUpload, isLoading, isresponse, count };
}
