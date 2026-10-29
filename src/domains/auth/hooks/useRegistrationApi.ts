import { useState } from 'react';

import { Scope } from '@src/enums/enums';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { signUp } from '../api/index';
import { nextStep, setEmailVerificationData, setLoginData } from '../slices/registerSlice';
import { ResgistrationResponse } from '../types/index';

export default function useRegistrationApi() {
    const dispatch = useAppDispatch();
    const { formData } = useAppSelector(state => state.reducer.registration);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState<string>('');
    const [corporateId, setCorporateId] = useState<number>();

    const handleSignup = async (otp: string) => {
        if (otp.length < 6) {
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
            name: ['FREELANCER', 'NEW_COMPANY'].includes(formData.signupType ?? '') ? formData.contactPersonName : formData.name,
            countryCode: 91,
            mobileNo: formData.phonenumber,
            email: formData.email,
            contactPersonName: formData.contactPersonName,
            password: formData.password,
            phoneOtp: otp,
            scope: Scope.MOBILE,
            referralCode: formData.referralCode,
            state: formData.state,
            accountType: formData.accountType,
            signupType: formData.signupType,
            marketingConsent: formData?.marketingConsent,
            policyIds: formData.policyIds,
        };
        const response: ResgistrationResponse | false = await signUp(payload as any);
        if (response) {
            const formatedMobile = formData.phonenumber

            setCorporateId(response.id);
            setEmail(response.email);
             if (
                typeof Moengage?.track_event === 'function' &&
                typeof Moengage?.identifyUser === 'function' &&
                typeof Moengage?.add_email === 'function' &&
                typeof Moengage?.add_mobile === 'function' &&
                typeof Moengage?.add_user_attribute === 'function' &&
                typeof Moengage?.add_user_name === 'function'
            ) {
                const userId = formData.email;
                Moengage.identifyUser(userId);
                Moengage.add_email(formData.email);
                Moengage.add_mobile(formatedMobile);
                Moengage.add_user_name(formData.contactPersonName);
                Moengage.add_user_attribute('company_name', formData.name);
              
                Moengage.track_event('user_signup', {
                    status: 'success',
                    referral:formData.referralCode
                });
            }

            dispatch(setLoginData({ ...response }));
            dispatch(setEmailVerificationData({ ...response }));
            dispatch(nextStep());
            setIsLoading(false);
        } else {
            setIsError(true);
            setIsLoading(false);
        }
    };

    return { handleSignup, isError, isLoading, email, corporateId };
}
