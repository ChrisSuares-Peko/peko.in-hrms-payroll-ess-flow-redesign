import * as Yup from 'yup';

import { nameValidation } from './validations';

export const otherBillsValidationSchema = Yup.object({
    beneficiary: Yup.string().required('Please select a beneficiary'),
    billTitle: nameValidation('Please enter a bill title', 'Bill title'),
    payeeName: nameValidation('Please enter payee name', 'Payee name'),
    dueDate: Yup.string().required('Please select due date'),
    description: nameValidation('Please enter a description', 'Description'),
    totalAmount: Yup.string()
        .required('Please enter total amount')
        .test('greater-than-zero', 'Total amount must be greater than 0', value => parseFloat(value ?? '0') > 0),
});
