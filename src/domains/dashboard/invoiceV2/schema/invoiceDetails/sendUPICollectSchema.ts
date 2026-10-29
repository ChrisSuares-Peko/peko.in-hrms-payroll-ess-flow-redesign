import * as Yup from 'yup';

export const sendUPICollectSchema = Yup.object().shape({
    amount: Yup.string()
        .trim()
        .required('Please enter a valid amount')
        .test('positive', 'Please enter a valid amount', val => !val || Number(val) > 0),
    upiId: Yup.string()
        .trim()
        .required('Please enter a UPI ID')
        .matches(/^[\w.-]+@[\w]+$/, 'Please enter a valid UPI ID (e.g., username@paytm)'),
    requestExpiry: Yup.string().nullable().required('Please select request expiry'),
});
