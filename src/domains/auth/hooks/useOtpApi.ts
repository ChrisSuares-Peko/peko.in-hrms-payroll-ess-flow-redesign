import { useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { Scope } from '@src/enums/enums';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getOtp } from '../api/index';
import { nextStep } from '../slices/registerSlice';

type OtpPayload = {
    password?: string;
    name: string;
    mobileNo: string;
    email: string;
    scope: Scope;
    resend: boolean;
};

export default function useOtpApi() {
    const dispatch = useAppDispatch();
    const { formData } = useAppSelector(state => state.reducer.registration);
    const [isLoading, setIsLoading] = useState(false);

    const handleOtp = async (resend: boolean, values: any = {}) => {
        setIsLoading(true);
        const payload: OtpPayload = {
            password: '',
            name: formData.name,
            mobileNo: `+91${formData.phonenumber}`,
            email: formData.email,
            scope: Scope.EMAIL,
            resend,
        };
        if (values.password) {
            payload.password = values.password;
        } else delete payload.password;
        const response: SuccessGenericResponse<{}> | false = await getOtp(payload);
        if (response) {
            if (!resend) {
                dispatch(nextStep());
            } else {
                dispatch(
                    showToast({
                        description: 'Your OTP has been successfully sent to your email address',
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        }
        setIsLoading(false);
    };

    const handleMobileResendOtp = async (resend: boolean, channel?: 'whatsapp') => {
        setIsLoading(true);
        const payload = {
            name: formData.name,
            mobileNo: `91${formData.phonenumber}`,
            email: formData.email,
            scope: Scope.MOBILE,
            resend,
            ...(channel && { channel }),
        };
        const response: SuccessGenericResponse<{ phoneOtp: string }> | false =
            await getOtp(payload);
        if (response) {
            if (!resend) {
                dispatch(nextStep());
            } else {
                dispatch(
                    showToast({
                        description:
                            channel === 'whatsapp'
                                ? 'Your OTP has been successfully sent to your WhatsApp'
                                : 'Your OTP has been successfully sent to your mobile number',
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    };

    return { handleOtp, isLoading, handleMobileResendOtp };
}
