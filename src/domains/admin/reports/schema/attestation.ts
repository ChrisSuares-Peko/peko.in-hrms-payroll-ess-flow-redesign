import * as Yup from 'yup';

import { numbers } from '@utils/regex';

const attestationSchema = Yup.object().shape({
    email: Yup.string()
        .required('Please enter the email ID')
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:,[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/,
            'Please enter a valid email ID'
        ),
    contactPersonPhone: Yup.string()
        .required('Please enter the mobile number')
        .matches(numbers, 'Please enter valid mobile number')
        .min(10, 'Mobile number must be 10 digits'),
    address: Yup.string()
        .required('Please enter the address')
        .min(3, 'Address must be at least 3 characters'),
});

export default attestationSchema;
