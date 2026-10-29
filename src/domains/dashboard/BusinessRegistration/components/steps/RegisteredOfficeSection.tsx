import { useFormikContext } from 'formik';

import RegisteredOfficeAddress from './RegisteredOfficeAddress';
import RegisteredOfficeAvailability from './RegisteredOfficeAvailability';

// Registered office availability + address — moved from Basic Information to
// the bottom of the KYC step (23-07 vendor-call flow) so it's only filled
// after payment. The address + pincode coordinates feed the smart-form filing.
const RegisteredOfficeSection = () => {
    const { values } = useFormikContext<{ registeredOffice?: string }>();
    return (
        <>
            <RegisteredOfficeAvailability />
            {values.registeredOffice === 'have' && <RegisteredOfficeAddress />}
        </>
    );
};

export default RegisteredOfficeSection;
