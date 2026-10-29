import { useAppSelector } from '@src/hooks/store';

import RegisterStepFour from '../sections/RegisterStepFour';
import RegisterStepOne from '../sections/RegisterStepOne';
import RegisterStepSeven from '../sections/RegisterStepSeven';
// import RegisterStepSix from '../sections/RegisterStepSix2';
import RegisterStepThree from '../sections/RegisterStepThree';
import RegisterStepTwo from '../sections/RegisterStepTwo';
import RegisterVerification from '../sections/RegisterVerification';
import ComplianceHealth from '../signupFlow/ComplianceHealth';
import GetStartedSignup from '../signupFlow/GetStartedSignup';
import NewCompanyIncorporation from '../signupFlow/NewCompanyIncorporation';

const RegisterView = () => {
    const currentStep = useAppSelector(state => state.reducer.registration.step);
    const { signupType } = useAppSelector(state => state.reducer.registration);
 
    return (
        <div className="min-h-screen ">
            {currentStep === 1 && <GetStartedSignup />}
            {currentStep === 2 && <NewCompanyIncorporation />}
            {currentStep === 3 && <RegisterStepOne />}

            {currentStep === 4 && <RegisterStepTwo />}
            {currentStep === 5 && <RegisterStepThree />}
            {currentStep === 6 && <RegisterStepFour />}
            {currentStep === 7 && signupType === 'COMPLIANCE_HEALTH' && <ComplianceHealth />}
            {currentStep === 7 && signupType === 'NEW_COMPANY' && <RegisterStepSeven />}
            {currentStep === 7 && signupType === 'EXISTING_COMPANY' && <RegisterVerification />}
            {currentStep === 7 && signupType === 'FREELANCER' && <RegisterVerification />}
            {/* {currentStep === 6 && <RegisterStepSix />} */}
            {currentStep === 8 && <RegisterStepSeven />}
        </div>
    );
};

export default RegisterView;
