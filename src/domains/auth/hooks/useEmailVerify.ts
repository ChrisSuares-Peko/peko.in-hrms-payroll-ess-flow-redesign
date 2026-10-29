import { useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyEmailOtp } from '../api/index';
import { nextStep } from '../slices/registerSlice';

export default function useVerifyEmailOtpApi() {
    const dispatch = useAppDispatch();
    const { formData } = useAppSelector(state => state.reducer.registration);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const handleVerifyOtp = async (emailOtp: string) => {
        if (emailOtp.length < 6) {
            dispatch(
                showToast({
                    description: 'Please enter a valid OTP',
                    variant: 'warning',
                })
            );
            return;
        }
        setIsLoading(true);
        const payload = {
            mobileNo: `91${formData.phonenumber}`,
            email: formData.email,
            emailOtp,
        };

        const response: SuccessGenericResponse<{ phoneOtp: string }> | false =
            await verifyEmailOtp(payload);

        if (response) {
            dispatch(nextStep());
            setIsLoading(false);
        } else {
            setIsError(true);
            setIsLoading(false);
        }
    };

    return { handleVerifyOtp, isLoading, isError };
}
