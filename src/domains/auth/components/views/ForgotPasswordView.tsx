import { useAppSelector } from '@src/hooks/store';

import ForgotPasswordStepOne from '../sections/ForgotPasswordStepOne';
import ForgotPasswordStepTwo from '../sections/ForgotPasswordStepTwo';

const ForgotPasswordView = () => {
    const currentStep = useAppSelector(state => state.reducer.forgotpassword.step);

    return (
        <div className="flex justify-center items-center min-h-screen">
            {currentStep === 1 && <ForgotPasswordStepOne />}
            {currentStep === 2 && <ForgotPasswordStepTwo />}
        </div>
    );
};

export default ForgotPasswordView;
