import * as Yup from 'yup';

import { withLetterRequired, withSpaceValidation } from '../../utils/yupHelpers';

export const bankAccountSchema = Yup.object().shape({
    bankName: withLetterRequired(
        withSpaceValidation(
            Yup.string().required('Please enter the bank name'),
            'Bank name'
        )
            .min(3, 'Bank name must be at least 3 characters')
            .max(100, 'Bank name cannot exceed 100 characters'),
        'Bank name'
    ),
    accountNumber: Yup.string()
        .required('Please enter the account number')
        .matches(/^\d+$/, 'Account number must contain digits only')
        .min(9, 'Account number must be at least 9 digits')
        .max(18, 'Account number cannot exceed 18 digits'),
    ifsc: Yup.string()
        .required('Please enter the IFSC code')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code (e.g. SBIN0001234)'),
});
