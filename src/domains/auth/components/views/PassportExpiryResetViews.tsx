import { useState } from 'react';

import { useLocation } from 'react-router-dom';

import useGetPasswordPolicies from '../../hooks/useGetPasswordPolicies';
import usePasswordExpiryReset from '../../hooks/usePasswordExpiryReset';
import usePasswordPolicyValidation from '../../hooks/usePasswordPolicyValidation';
import PasswordExpiryResetStep1 from '../sections/PasswordExpiryResetStep1';
import PasswordExpiryResetStep2 from '../sections/PasswordExpiryResetStep2';

const PassportExpiryResetViews = () => {
    const { state } = useLocation();
    const { handleResettPassword, isLoading, userData } = usePasswordExpiryReset(state);
    const [currentStep, setCurrentStep] = useState(1);
    const { respData } = useGetPasswordPolicies(userData?.userName);
    const { validatePassword } = usePasswordPolicyValidation(respData);

    const handleSubmit = (password: string) => {
        if (userData) {
            const payload = {
                password: userData.password,
                newPassword: password,
                username: userData.userName,
            };
            handleResettPassword(payload);
        }
    };
    return (
        <div className="flex justify-center items-center min-h-screen">
            {currentStep === 1 && <PasswordExpiryResetStep1 setCurrentStep={setCurrentStep} />}
            {currentStep === 2 && (
                <PasswordExpiryResetStep2
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                    validatePassword={validatePassword}
                />
            )}
        </div>
    );
};

export default PassportExpiryResetViews;
