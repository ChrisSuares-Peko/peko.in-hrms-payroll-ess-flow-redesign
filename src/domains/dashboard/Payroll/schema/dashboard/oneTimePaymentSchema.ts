import * as Yup from 'yup';

export const oneTimePaymentSchema = Yup.object().shape({
    month: Yup.string()
        .required('Please select the month')
        .matches(/^\d{4}-(0[1-9]|1[0-2])$/, 'Please select a valid month'),
    employee: Yup.string().required('Please select the employee'),
    amount: Yup.string()
        .required('Please enter the amount')
        .test('greater-than-zero', 'Amount must be greater than 0', val => parseFloat(val ?? '0') > 0),
    remark: Yup.string()
        .max(200, 'Remark cannot exceed 200 characters')
        .matches(/^\S/, 'Remark cannot start with whitespace')
        .matches(/\S$/, 'Remark cannot end with whitespace')
        .matches(/^(?!.*\s{2})/, 'Remark cannot contain consecutive whitespaces'),
    payFrom: Yup.string().required('Please select the bank account'),
});
