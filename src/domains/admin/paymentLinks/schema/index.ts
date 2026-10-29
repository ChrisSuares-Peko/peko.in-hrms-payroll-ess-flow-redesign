import * as Yup from 'yup';

export const paymentLinkSchema = Yup.object().shape({
    corporate: Yup.string().required('Please select a corporate'),
    service: Yup.string().required('Please select a service'),
    amount: Yup.string()
        .required('Please enter the amount')
        .matches(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number with up to two decimal places')
        .test('is-not-zero', 'Amount cannot be zero', value => Number(value) !== 0)
        .max(15, 'Maximum 15 characters are allowed'),

    expires_at: Yup.number()
        .required('Expiry time is required')
        .positive('Expiry time must be a positive number')
        .integer('Expiry time must be a whole number'),
    notification: Yup.string().required(),
});

export const mailSchema = Yup.object().shape({
    email: Yup.string()
        .email('Please enter a valid email ID')
        .required(' Please enter the email ID ')
        .test(
            'is-valid-email',
            'Please enter a valid email ID',
            value => !/^\.|^.+@\.|^.*\.@.*\..*|^.*\.$/.test(value)
        ),
});
