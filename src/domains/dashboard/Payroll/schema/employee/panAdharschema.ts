import * as Yup from 'yup';

export const validationSchema = Yup.object().shape({
    panNumber: Yup.string()
        .matches(/^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/, 'Please enter a valid PAN')
        .required('Please enter the PAN of the employee'),

    aadhaarNumber: Yup.string()
        // .matches(/^[2-9]{1}[0-9]{11}$/, 'Please enter a valid Aadhaar number')
        .matches(/^\d{12}$/, 'Please enter a valid aadhaar number')
        .required('Please enter the aadhaar number of the employee'),
});
