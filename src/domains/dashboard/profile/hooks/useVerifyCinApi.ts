import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyGSTPan } from '../api/verify';
import { verifyGSTPayload } from '../types';
// import { GSTDetailsResponse } from '../types/index';

export default function VerifycinNo() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [Loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();
    const verifyCINDetails = async (cinNo: string) => {
        setLoading(true);
        try {
            const payload: verifyGSTPayload = {
                userId: id,
                userType: role,
                value: cinNo,
                type: 'cin',
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
            return { success: false, message: error.message || 'Failed to verify CIN', data: null };
        } finally {
            setLoading(false); // Ensure loading stops even on error
        }
    };

    return { Loading, verifyCINDetails };
}
