import * as Yup from 'yup';

// const nameRegex = /^[A-Za-z0-9\s\-']+$/;
const emailRegex = /^(?!\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/;
export const workInformationSchema = Yup.object().shape({
    pocName: Yup.string()
        .required('Please enter the POC name')

        .test(
            'no-leading-trailing-space',
            'POC name cannot start or end with a blank space.',
            value => (value ? value.trim() === value : true)
        )
        .test('no-multiple-spaces', 'POC name cannot contain consecutive blank spaces.', value =>
            value ? !/\s{2,}/.test(value) : true
        )
        .min(3, 'POC name must be at least 3 characters'),
    email: Yup.string()
        .email('Please enter a valid email ID')
        .required('Please enter the email ID')
        .matches(emailRegex, 'Please enter a valid email ID'),
    mobile: Yup.string()
        .required('Please enter the mobile number')
        .matches(/^\d{9,10}$/, 'Mobile number must be at least 9 digits'),
    requirement: Yup.string()
        .required('Please enter the requirements')

        // .matches(nameRegex, 'Enter a valid requirement')
        .test(
            'no-leading-trailing-space',
            'Requirements cannot start or end with a blank space.',
            value => (value ? value.trim() === value : true)
        )
        .test(
            'no-multiple-spaces',
            'Requirements cannot contain consecutive blank spaces.',
            value => (value ? !/\s{2,}/.test(value) : true)
        )
        .min(3, 'Requirements must be at least 3 characters'), // Not only whitespaces
});
