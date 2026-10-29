import * as Yup from 'yup';

const editPassword = Yup.object().shape({
    oldPassword: Yup.string().required('Please enter your current password'),
    newPassword: Yup.string()
        .required('Please enter your new password')
        .min(8, 'Password must have at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[0-9!@#$%^&*(),.?":{}|<>]/, 'Password must contain a number or symbol'),
    ConfirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm your password'),
});

export default editPassword;
