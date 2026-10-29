import * as Yup from 'yup';

import { withGstinValidation, withSpaceValidation } from '../utils/yupHelpers';

export const eInvoiceSignInSchema = Yup.object({
    gstin: withSpaceValidation(
        withGstinValidation(Yup.string().required('Please enter the GSTIN')),
        'GSTIN'
    ),
    clientId: withSpaceValidation(
        Yup.string()
            .required('Please enter the Client ID')
            .min(3, 'Client ID must be at least 3 characters'),
        'Client ID'
    ),
    password: Yup.string()
        .required('Please enter the password')
        .min(6, 'Password must be at least 6 characters'),
});
