import * as Yup from 'yup';

const spaceTests = (label: string, schema: Yup.StringSchema) =>
    schema
        .test('not-only-spaces', `${label} cannot be only spaces`, v => !v || !/^\s*$/.test(v))
        .test('no-leading-space', `${label} cannot start with a space`, v => !v || !/^\s/.test(v))
        .test('no-trailing-space', `${label} cannot end with a space`, v => !v || !/\s$/.test(v))
        .test('no-consecutive-spaces', `${label} cannot have consecutive spaces`, v => !v || !/\s{2,}/.test(v));

const alphabetAndSpacesOnly = (label: string, schema: Yup.StringSchema) =>
    schema.matches(/^[A-Za-z ]+$/, `${label} can contain only alphabets and spaces`);

export const getBankAccountSchema = (isBranchRequired = false) => Yup.object({
    accountHolderName: spaceTests(
        'Account holder name',
        alphabetAndSpacesOnly(
            'Account holder name',
            Yup.string()
                .required('Please enter the Account Holder Name')
                .min(3, 'At least 3 characters')
                .max(100, 'Maximum 100 characters')
        )
    ),
    bankName: spaceTests(
        'Bank name',
        alphabetAndSpacesOnly(
            'Bank name',
            Yup.string()
                .required('Please enter the Bank Name')
                .min(3, 'At least 3 characters')
                .max(100, 'Maximum 100 characters')
        )
    ),
    accountNumber: Yup.string()
        .required('Please enter the Account Number')
        .matches(/^\d{9,18}$/, 'Must be 9 to 18 digits'),
    ifscCode: Yup.string()
        .required('Please enter IFSC')
        .length(11, 'IFSC code must be exactly 11 characters')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code (e.g. HDFC0001234)')
        .test('no-whitespace', 'IFSC code cannot contain spaces', v => !v || !/\s/.test(v)),
    accountType: Yup.string().required('Please select the Account Type'),
    branch: spaceTests(
        isBranchRequired ? 'Branch address' : 'Branch name',
        isBranchRequired
            ? Yup.string()
                .required('Please enter the Branch Address')
                .min(10, 'At least 10 characters')
                .max(250, 'Maximum 250 characters')
            : Yup.string().max(250, 'Maximum 250 characters').optional()
    ),
});

export const bankAccountSchema = getBankAccountSchema(false);

export const editVaSchema = Yup.object({
    name: spaceTests(
        'Name',
        Yup.string()
            .required('Name is required')
            .min(3, 'At least 3 characters')
            .max(100, 'Maximum 100 characters')
    ),
    emailAddress: Yup.string()
        .required('Email is required')
        .email('Enter a valid email address'),
    mobileNumber: Yup.string()
        .required('Mobile number is required')
        .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
    panNumber: Yup.string()
        .required('PAN number is required')
        .length(10, 'PAN must be exactly 10 characters')
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)'),
    address: spaceTests('Address', Yup.string().required('Address is required')),
});

export const bankAccountInitialValues = {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'savings' as 'savings' | 'current',
    branch: '',
};

export const editVaInitialValues = {
    name: '',
    emailAddress: '',
    mobileNumber: '',
    panNumber: '',
    address: '',
};
