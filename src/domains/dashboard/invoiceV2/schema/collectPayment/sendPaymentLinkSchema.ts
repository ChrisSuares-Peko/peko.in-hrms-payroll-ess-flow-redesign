import * as Yup from 'yup';

import { withLetterRequired, withSpaceValidation } from '../../utils/yupHelpers';

export const sendPaymentLinkSchema = Yup.object().shape({
    amount: Yup.string().trim().required('Amount is required'),
    customerName: withLetterRequired(
        withSpaceValidation(Yup.string().optional(), 'Customer name'),
        'Customer name'
    ),
    customerPhone: Yup.string()
        .trim()
        .required('Customer phone is required')
        .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number starting with 6-9'),
});
