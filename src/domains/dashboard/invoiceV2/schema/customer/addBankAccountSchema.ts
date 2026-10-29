import * as Yup from 'yup';

import { withLetterRequired, withSpaceValidation } from '../../utils/yupHelpers';

export const addBankAccountSchema = Yup.object().shape({
    accountHolderName: withLetterRequired(
        withSpaceValidation(
            Yup.string().required('Please enter the account holder name'),
            'Account holder name'
        )
            .min(3, 'Account holder name must be at least 3 characters')
            .max(100, 'Account holder name cannot exceed 100 characters'),
        'Account holder name'
    ),
    accountNumber: Yup.string()
        .required('Please enter the account number')
        .matches(/^\d+$/, 'Account number must contain digits only')
        .min(9, 'Account number must be at least 9 digits')
        .max(18, 'Account number cannot exceed 18 digits'),
    ifscCode: Yup.string()
        .required('Please enter the IFSC code')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
            message: 'Enter a valid IFSC code',
            excludeEmptyString: true,
        }),
    swiftCode: Yup.string()
        .optional()
        .test('swift-validation', 'SWIFT code must be 8-11 alphanumeric characters', value => {
            if (!value) return true;
            return /^[A-Za-z0-9]{8,11}$/.test(value);
        }),
});
