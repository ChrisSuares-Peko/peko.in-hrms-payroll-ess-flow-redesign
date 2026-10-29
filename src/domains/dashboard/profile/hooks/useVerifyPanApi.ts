import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyGSTPan } from '../api/verify';
import { verifyGSTPayload } from '../types';
// import { PANDetailsResponse } from '../types/index';

export default function VerifypanNo() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const verifyPanDetails = async (panNo: string) => {
        setIsLoading(true);
        try {
            const payload: verifyGSTPayload = {
                userId: id,
                userType: role,
                value: panNo,
                type: 'pan',
            };

            const response: any | false = await verifyGSTPan(payload);
            if (!response) throw new Error('Something went wrong, please try again later.');

            const { data } = response;

            return data;
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

    return { isLoading, verifyPanDetails };
}
