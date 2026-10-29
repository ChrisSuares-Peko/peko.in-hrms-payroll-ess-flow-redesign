import * as Yup from 'yup';

export const addAccountValidationSchema = Yup.object({
    accountHolderName: Yup.string()
        .required('Please enter the account holder name')
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .test('no-leading-trailing-space', 'Name cannot start or end with a blank space', value => !value || (!/^\s/.test(value) && !/\s$/.test(value)))
        .test('no-consecutive-spaces', 'Name cannot contain consecutive blank spaces', value => !value || !/\s{2,}/.test(value))
        .test('not-only-whitespace', 'Name cannot be only blank space', value => !value || !/^\s*$/.test(value)),
    bankName: Yup.string()
        .required('Please enter the bank name')
        .min(3, 'Bank name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .test('no-leading-trailing-space', 'Bank name cannot start or end with whitespace', value => !value || (!/^\s/.test(value) && !/\s$/.test(value)))
        .test('no-consecutive-spaces', 'Bank name cannot contain consecutive whitespaces', value => !value || !/\s{2,}/.test(value))
        .test('not-only-whitespace', 'Bank name cannot be only whitespace', value => !value || !/^\s*$/.test(value)),
    accountNumber: Yup.string()
        .required('Please enter the account number')
        .matches(/^[0-9]{9,18}$/, 'Account number must be between 9 to 18 digits'),
    ifscCode: Yup.string()
        .required('Please enter the IFSC code')
        .length(11, 'IFSC code must be 11 characters')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code'),
    currency: Yup.string().required('Please select the currency'),
    accountType: Yup.string().required('Please select the account type'),
    branchName: Yup.string()
        .optional()
        .test('no-leading-trailing-space', 'Branch name cannot start or end with whitespace', value => !value || (!/^\s/.test(value) && !/\s$/.test(value)))
        .test('no-consecutive-spaces', 'Branch name cannot contain consecutive whitespaces', value => !value || !/\s{2,}/.test(value))
        .test('not-only-whitespace', 'Branch name cannot be only whitespace', value => !value || !/^\s*$/.test(value)),
});
