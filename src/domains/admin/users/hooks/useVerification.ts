import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyGSTPan } from '../api/index';
import { verifyGSTPayload } from '../types/corporateUserTypes';

type VerificationType = 'gst' | 'pan' | 'cin';

export default function useVerification() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [loadingStates, setLoadingStates] = useState({
        gst: false,
        pan: false,
        cin: false,
    });

    const verify = async (value: string, email: string, type: VerificationType) => {
        setLoadingStates(prev => ({ ...prev, [type]: true }));
        try {
            const payload: verifyGSTPayload = {
                userId: id,
                userType: role,
                value,
                type,
                email,
            };

            const response: any = await verifyGSTPan(payload);
            if (!response) throw new Error(`Failed to verify ${type.toUpperCase()}`);

            return response.data;
        } catch (error: any) {
            dispatch(
                showToast({
                    description: error.message || `Failed to verify ${type.toUpperCase()}`,
                    variant: 'error',
                })
            );
            return {
                success: false,
                message: error.message || `Failed to verify ${type.toUpperCase()}`,
                data: null,
            };
        } finally {
            setLoadingStates(prev => ({ ...prev, [type]: false }));
        }
    };

    return {
        verifyGST: (gst: string, email: string) => verify(gst, email, 'gst'),
        verifyPAN: (pan: string, email: string) => verify(pan, email, 'pan'),
        verifyCIN: (cin: string, email: string) => verify(cin, email, 'cin'),
        isLoadingGST: loadingStates.gst,
        isLoadingPAN: loadingStates.pan,
        isLoadingCIN: loadingStates.cin,
    };
}
