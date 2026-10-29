import * as Yup from 'yup';

export const ReceiverDetailsSchema = Yup.object().shape({
    phone: Yup.string()
        .trim()
        .min(10, 'Mobile number must be at least 10 digits')
        .max(10)
        .required('Please enter the mobile number'),

    emailAddress: Yup.string()
        .email('Please enter a valid email ID')
        .matches(
            /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email ID'
        )
        .required('Please enter the email ID'),
});
