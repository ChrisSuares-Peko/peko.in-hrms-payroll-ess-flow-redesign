import { useState } from 'react';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { hideLoader, showLoader } from '@src/slices/loaderSlice';

import { validateEmployeeSubscriptionLimit } from '../../api/employeeApi';
import { validateLimitSubscription } from '../../types/types';



export const useValidateEmployeeSubscriptionLimit = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    

    const validateLimit = async (payload: validateLimitSubscription) => {
        setIsLoading(true);

        try {
            dispatch(showLoader())
            const response:any = await validateEmployeeSubscriptionLimit(payload);
            dispatch(hideLoader())
            // ✅ Success
            // console.log("response", response)
            if (response?.status) {
                return response;
            }
            // ❌ API Error
            dispatch(
                showToast({
                    variant: 'error',
                    description:
                        response?.errorMessage ||
                        'Subscription limit exceeded',
                })
            );

            return null;
        } catch (error) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Something went wrong',
                })
            );

            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        validateLimit,
        isLoading,
    };
};
