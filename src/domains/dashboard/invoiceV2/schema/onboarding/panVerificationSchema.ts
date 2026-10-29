import * as Yup from 'yup';

export const panVerificationSchema = Yup.object().shape({
    pan: Yup.string()
        .required('Please enter your PAN number')
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Enter a valid PAN (e.g. ABCDE1234F)'),
});
