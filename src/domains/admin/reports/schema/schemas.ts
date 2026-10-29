import * as Yup from 'yup';

export const schema = Yup.object().shape({
    email: Yup.string()
        .email('Please enter a valid email ID')
        .required('Please enter the email ID')
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email ID'
        ),
});
