import { useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyOtpForPanGst, verifyPanGST } from '../api';
import { nextStep } from '../slices/registerSlice';

type PanGstPayload = {
    type: 'pan' | 'gst';
    value: string;
    contactPersonName: string;
    name: string;
    email: string;
    signupType?: string;
};

export default function usePanGstApi() {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handlePanGst = async (payload: PanGstPayload) => {
        setIsLoading(true);
        try {
            const data: SuccessGenericResponse<{}> | false = await verifyPanGST(payload);
            return { success: true, data };
        } catch (error: any) {
            dispatch(
                showToast({
                    description: error.message || 'Failed to verify GST',
                    variant: 'error',
                })
            );
            return { success: false, message: error.message || 'Failed to verify GST', data: null };
        } finally {
            setIsLoading(false); // Ensure loading stops even on error
        }
    };

    const handleVerifyPanGst = async (mobileNo: string, otp: string, identifier: string) => {
        setIsLoading(true);
        const payload = {
            mobileNo,
            otp,
            identifier, // PAN or GST
        };
        const response: SuccessGenericResponse<{}> | false = await verifyOtpForPanGst(payload); // API to verify with OTP
        if (response) {
            dispatch(
                showToast({
                    description: `Your ${identifier.length === 10 ? 'PAN' : 'GST'} has been successfully verified with the OTP.`,
                    variant: 'success',
                })
            );
            dispatch(nextStep()); // To switch to next step
        } else {
            dispatch(
                showToast({
                    description: `Failed to verify your ${identifier.length === 10 ? 'PAN' : 'GST'} with the provided OTP. Please try again.`,
                    variant: 'error',
                })
            );
        }
        setIsLoading(false);
    };

    return { handlePanGst, handleVerifyPanGst, isLoading };
}
