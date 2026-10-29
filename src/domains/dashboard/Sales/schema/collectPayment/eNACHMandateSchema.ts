import * as Yup from 'yup';

export const eNACHMandateSchema = Yup.object().shape({
    customer: Yup.object().shape({
        name: Yup.string().trim(),
        email: Yup.string()
            .trim()
            .required('Please enter a valid email')
            .email('Please enter a valid email'),
        mobile: Yup.string()
            .trim()
            .required('Please enter a valid mobile number')
            .matches(/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'),
    }),
    mandate: Yup.object().shape({
        maxAmount: Yup.string()
            .trim()
            .required('Please enter a valid amount')
            .test('positive', 'Please enter a valid amount', val => !val || Number(val) > 0),
        frequency: Yup.string()
            .oneOf(['monthly', 'quarterly'])
            .required('Please select a frequency'),
        startDate: Yup.string().nullable().required('Please select a start date'),
        endDate: Yup.string().nullable(),
        untilCancelled: Yup.boolean(),
    }),
    purpose: Yup.object().shape({
        description: Yup.string().trim(),
    }),
});
