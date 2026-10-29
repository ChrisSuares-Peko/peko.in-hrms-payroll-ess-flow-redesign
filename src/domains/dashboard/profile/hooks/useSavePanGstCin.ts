import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { saveDoc } from '../api/verify';
// import { PANDetailsResponse } from '../types/index';

export default function useSavePanGstCin() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const saveDocument = async (body: {}) => {
        setIsLoading(true);
        try {
            const payload: any = {
                userId: id,
                userType: role,
                ...body,
            };

            const response: any | false = await saveDoc(payload);
            if (!response)
                throw new Error(
                    'There was some issue in verifying your PAN number, please try again.'
                );

            return response;
        } catch (error: any) {
            dispatch(
                showToast({
                    description: error.message || 'Failed to verify PAN',
                    variant: 'error',
                })
            );
            return { success: false, message: error.message || 'Failed to verify PAN', data: null };
        } finally {
            setIsLoading(false); // Ensure loading stops even on error
        }
    };

    return { isLoading, saveDocument };
}
