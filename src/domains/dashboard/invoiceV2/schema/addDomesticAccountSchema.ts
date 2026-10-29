import * as Yup from 'yup';

import { withLetterRequired, withSpaceValidation } from '../utils/yupHelpers';

export const addDomesticAccountSchema = Yup.object().shape({
    accountHolderName: withLetterRequired(
        withSpaceValidation(
            Yup.string().required('Please enter the account holder name'),
            'Account holder name'
        ),
        'Account holder name'
    )
        .min(3, 'Account holder name must be at least 3 characters')
        .max(100, 'Account holder name cannot exceed 100 characters'),
    bankName: withLetterRequired(
        withSpaceValidation(Yup.string().required('Please enter the bank name'), 'Bank name'),
        'Bank name'
    )
        .min(3, 'Bank name must be at least 3 characters')
        .max(100, 'Bank name cannot exceed 100 characters'),
    accountNumber: Yup.string()
        .trim()
        .required('Please enter the account number')
        .matches(/^\d+$/, 'Account number must contain digits only')
        .min(9, 'Account number must be at least 9 digits')
        .max(18, 'Account number cannot exceed 18 digits'),
    ifscCode: Yup.string()
        .trim()
        .required('Please enter the IFSC code')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
            message: 'Enter a valid IFSC code ',
            excludeEmptyString: true,
        }),
    accountType: Yup.string().required('Account type is required'),
    bankBranch: withSpaceValidation(
        Yup.string().required('Please enter the branch name'),
        'Branch name'
    ).max(100, 'Branch name cannot exceed 100 characters'),
});
