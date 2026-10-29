import { useState } from 'react';



import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { BulkValidate } from '../../api/employeeApi';
import { setBulkEmployeeData } from '../../slices/jsonSlice';
import { BulkUploadCreatePayload } from '../../types/types';

export function useBulkValidateApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const bulkValidate = async (payload: BulkUploadCreatePayload) => {
        setIsLoading(true); // Set loading state to true before API call

        const response = await BulkValidate({
            jsonData: payload.jsonData,
            userId: id,
            userType: role,
        });

        if (response?.status) {
            dispatch(setBulkEmployeeData(response.data.jsonData));
        } else {
            dispatch(
                showToast({
                    variant: 'error',
                    description: response!.message,
                })
            );
        }

        setIsLoading(false);
    };

    return { bulkValidate, isLoading };
}
