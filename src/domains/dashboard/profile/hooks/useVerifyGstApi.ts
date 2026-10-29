import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyGSTPan } from '../api/verify';
import { verifyGSTPayload } from '../types';
// import { GSTDetailsResponse } from '../types/index';

export default function VerifygstNo() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoader, setIsLoader] = useState(false);
    const dispatch = useAppDispatch();
    const verifyGstDetails = async (gstinNo: string) => {
        setIsLoader(true);
        try {
            const payload: verifyGSTPayload = {
                userId: id,
                userType: role,
                value: gstinNo,
                type: 'gst',
            };

            const response: any = await verifyGSTPan(payload);
            if (!response) throw new Error('Something went wrong, please try again later.');

            const { data } = response;
            return data;
        } catch (error: any) {
            dispatch(
                showToast({
                    description: error.message || 'Failed to verify GST',
                    variant: 'error',
                })
            );
            return { success: false, message: error.message || 'Failed to verify GST', data: null };
        } finally {
            setIsLoader(false); // Ensure loading stops even on error
        }
    };

    return { isLoader, verifyGstDetails };
}
