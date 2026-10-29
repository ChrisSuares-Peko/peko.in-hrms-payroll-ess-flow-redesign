import * as Yup from 'yup';

const emailRegex = /^(?!\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/;

export const connectRequestSchema = Yup.object().shape({
    name: Yup.string()
        .matches(/^[a-zA-Z ]+$/, 'Please enter valid name')
        .required('Please enter the name')
        .min(3, 'Name must be at least 3 characters')
        .test(
            'no-edge-whitespace',
            'Name cannot start or end with a blank space.',
            value => value == null || (!/^\s/.test(value) && !/\s$/.test(value))
        )
        .test(
            'no-multiple-whitespace',
            'Name cannot contain consecutive blank spaces.',
            value => value == null || !/\s{2,}/.test(value)
        )
        .test(
            'not-only-whitespace',
            'Name cannot be only blank space.',
            value => value == null || !/^\s*$/.test(value)
        ),
    email: Yup.string()
        .email('Please enter a valid email ID')
        .required('Please enter the email ID')
        .matches(emailRegex, 'Please enter a valid email ID'),
    mobile: Yup.string()
        .min(10, 'Mobile number must be at least 10 digits')
        .required('Please enter the mobile number'),
    preferredMode: Yup.string().required('Please select preferred mode'),
    requirement: Yup.string().matches(/^[a-zA-Z\s]+$/, 'Only alphabets and spaces are allowed'),
});
