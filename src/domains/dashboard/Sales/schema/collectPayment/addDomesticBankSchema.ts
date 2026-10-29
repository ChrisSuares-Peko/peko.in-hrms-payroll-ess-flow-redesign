import * as Yup from 'yup';

import { withLetterRequired, withSpaceValidation } from '../../utils/yupHelpers';

export const addDomesticBankSchema = Yup.object().shape({
    accountHolderName: withLetterRequired(
        withSpaceValidation(
            Yup.string()
                .required('Please enter the account holder name')
                .min(3, 'Minimum 3 characters')
                .max(50, 'Maximum 50 characters'),
            'Account holder name'
        ),
        'Account holder name'
    ),
    bankName: withLetterRequired(
        withSpaceValidation(
            Yup.string()
                .required('Please enter the bank name')
                .min(3, 'Minimum 3 characters')
                .max(50, 'Maximum 50 characters'),
            'Bank name'
        ),
        'Bank name'
    ),
    accountNumber: Yup.string()
        .required('Please enter the account number')
        .matches(/^[0-9]{9,18}$/, 'Account number must be 9–18 digits'),
    ifscCode: Yup.string()
        .required('Please enter the IFSC code')
        .length(11, 'IFSC code must be 11 characters')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code'),
    accountType: Yup.string().required('Please select an account type'),
    bankBranch: withSpaceValidation(
        Yup.string()
            .required('Please enter the branch name')
            .min(3, 'Minimum 3 characters')
            .max(50, 'Maximum 50 characters'),
        'Bank branch'
    ),
});
