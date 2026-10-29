import * as Yup from 'yup';

import { alphaNumeric, indianMobileRegex } from '@utils/regex';

const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const alphabets = /^[a-zA-Z\s]+$/;
export const addressSchema = Yup.object().shape({
    addressType: Yup.string().required('Please select the address type'),
    name: Yup.string()
        .required('Please enter the name')
        .test(
            'not-only-whitespace',
            'Name cannot start or end with a blank space.',
            value => !/^\s*$/.test(value)
        )
        .test(
            'no-leading-trailing-whitespace',
            'Name cannot start or end with a blank space.',
            value => !/^\s/.test(value) && !/\s$/.test(value)
        )
        .test(
            'no-multiple-whitespace',
            'Name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        )
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .matches(/^[a-zA-Z\s]+$/, 'Name must contain only alphabets and spaces'),
    addressLine1: Yup.string()
        .required('Please enter the address line 1')
        .test(
            'not-only-whitespace',
            'Address line 1 cannot start or end with a blank space.',
            value => !/^\s*$/.test(value)
        )
        .test(
            'no-leading-trailing-whitespace',
            'Address line 1 cannot start or end with a blank space.',
            value => !/^\s/.test(value) && !/\s$/.test(value)
        )
        .test(
            'no-multiple-whitespace',
            'Address line 1 cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        )
        .test(
            'not-only-numbers',
            'Address line 1 cannot contain only numbers',
            value => /[^\d\s]/.test(value || '')
        )
        .min(3, 'Address line 1 must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .matches(alphaNumeric, 'Please enter a valid address line 1'),
    addressLine2: Yup.string()
        .required('Please enter the address line 2')
        .test(
            'not-only-whitespace',
            'Address line 2 cannot start or end with a blank space.',
            value => !/^\s*$/.test(value)
        )
        .test(
            'no-leading-trailing-whitespace',
            'Address line 2 cannot start or end with a blank space.',
            value => !/^\s/.test(value) && !/\s$/.test(value)
        )
        .test(
            'no-multiple-whitespace',
            'Address line 2 cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        )
        .test(
            'not-only-numbers',
            'Address line 2 cannot contain only numbers',
            value => /[^\d\s]/.test(value || '')
        )
        .min(3, 'Address line 2 must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .matches(alphaNumeric, 'Please enter a valid address line 2'),
    phoneNumber: Yup.string()
        .required('Please enter the mobile number')
        .min(10, 'Mobile number must be 10 digits')
        .max(10, 'Mobile number must be 10 digits')
        .matches(indianMobileRegex, 'Please enter a valid 10-digit mobile number'),
    state: Yup.string().required('Please select the state'),
    zipCode: Yup.string()
        .required('Please enter the PIN code')
        .matches(/^\d+$/, 'Please enter a valid PIN Code')
        .length(6, 'PIN code must be exactly 6 digits'),
    city: Yup.string()
        .required('Please enter the city name')
        .test(
            'not-only-whitespace',
            'City cannot start or end with a blank space.',
            value => !/^\s*$/.test(value)
        )
        .test(
            'no-leading-trailing-whitespace',
            'City cannot start or end with a blank space.',
            value => !/^\s/.test(value) && !/\s$/.test(value)
        )
        .test(
            'no-multiple-whitespace',
            'City cannot contain consecutive blank spaces.',
            value => !/\s{2,}/.test(value)
        )
        .min(3, 'City name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .matches(/^[a-zA-Z\s]+$/, 'Please enter a valid city'),
});

const noLeadingOrTrailingWhitespace = {
    test: 'no-leading-or-trailing-whitespace',
    message: 'Cannot start or end with whitespace',
    testFn: (value?: string) => !value || value === value.trim(),
};
export const bankSchema = Yup.object().shape({
    accountHolderName: Yup.string()
        .required('Please enter the account holder name')
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Name cannot start or end with a blank space',
            noLeadingOrTrailingWhitespace.testFn
        )
        .test(
            'no-multiple-whitespace',
            'Name cannot contain consecutive blank spaces',
            value => !/\s{2,}/.test(value)
        )
        .test(
            'not-only-whitespace',
            'Name cannot be only blank space',
            value => !/^\s*$/.test(value)
        )
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed'),
    bankName: Yup.string()
        .required('Please enter the bank name')
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Bank name cannot start or end with a blank space',
            noLeadingOrTrailingWhitespace.testFn
        )
        .test(
            'no-multiple-whitespace',
            'Bank name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value || '')
        )
        .test(
            'not-only-whitespace',
            'Bank name cannot be only whitespace',
            value => !/^\s*$/.test(value || '')
        )
        .min(3, 'Bank name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed'),
    accountNumber: Yup.string()
        .matches(/^[0-9]{9,18}$/, 'Account number must be between 9 to 18 digits')
        .min(9, 'Account number must be at least 9 digits')
        .required('Please enter the account number'),
    bankBranch: Yup.string()
        .optional()
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Bank branch cannot start or end with a blank space',
            value => !value || noLeadingOrTrailingWhitespace.testFn(value)
        )
        .test(
            'no-multiple-whitespace',
            'Bank branch cannot contain consecutive whitespaces',
            value => !value || !/\s{2,}/.test(value)
        )
        .test(
            'min-length',
            'Bank branch must be at least 3 characters',
            value => !value || value.length >= 3
        )
        .max(50, 'Maximum 50 characters are allowed')
        .test(
            'valid-branch',
            'Please enter a valid bank branch',
            value => !value || /^[a-zA-Z\s]+$/.test(value)
        ),

    ifscCode: Yup.string()
        .required('Please enter the IFSC code')
        .length(11, 'IFSC code must be 11 characters')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC Code.'),

    accountType: Yup.string().required('Please select an account type'),
});

export const basicInfoSchema = Yup.object().shape({
    contactPersonName: Yup.string()
        .required('Please enter the full name')
        .min(3, 'Full name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .matches(alphabets, 'Please enter a valid name')
        .test(
            'no-leading-whitespace',
            'Full name cannot start with whitespace',
            value => !value || !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-trailing-whitespace',
            'Full name cannot end with whitespace',
            value => !value || !/\s$/.test(value) // Check if ends with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Full name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Full name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ),
    name: Yup.string().optional(),
    // companySize: Yup.string().required('Please select the company size'),
    state: Yup.string().required('Please select the state'),
    city: Yup.string()
        .required('Please enter the city name')
        .min(3, 'City name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .matches(alphabets, 'Please enter a valid city')
        .test(
            'no-leading-whitespace',
            'City name cannot start with whitespace',
            value => !value || !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-trailing-whitespace',
            'City name cannot end with whitespace',
            value => !value || !/\s$/.test(value) // Check if ends with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'City name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'City cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    email: Yup.string().email('Please enter valid email').required('Please enter email address'),
    mobileNo: Yup.string()
        .required('Please enter mobile number')
        .min(10, 'Mobile number must be at least 10 digits')
        .max(10, 'Maximum 10 characters are allowed')
        .matches(indianMobileRegex, 'Please enter a valid mobile number'),
    designation: Yup.string()
        .required('Please enter the designation name')
        .min(3, 'Designation name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .matches(alphabets, 'Please enter a valid designation')
        .test(
            'no-leading-whitespace',
            'Designation name cannot start with whitespace',
            value => !value || !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-trailing-whitespace',
            'Designation name cannot end with whitespace',
            value => !value || !/\s$/.test(value) // Check if ends with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Designation name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Designation name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    landlineNo: Yup.string()
        .trim()
        .min(10, 'Landline number must be 10 digits')
        .max(10, 'Landline number must be 10 digits'),
});

export const companyInfoSchema = Yup.object().shape({
    activity: Yup.string().optional(),

    gstNumber: Yup.string()
        .trim()
        .optional()
        .test(
            'is-uppercase',
            'GSTIN must be in uppercase',
            value => !value || value === value.toUpperCase()
        )
        .test('length', 'GSTIN must be 15 characters', value => !value || value.length === 15)
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
            message: 'Invalid GSTIN format',
            excludeEmptyString: true,
        }),

    cinNumber: Yup.string()
        .trim()
        .optional()
        .test(
            'is-uppercase',
            'CIN must be in uppercase',
            value => !value || value === value.toUpperCase()
        )
        .test('length', 'CIN must be 21 characters', value => !value || value.length === 21)
        .matches(cinRegex, { message: 'Invalid CIN format', excludeEmptyString: true }),

    panNumber: Yup.string()
        .trim()
        .optional()
        .test(
            'is-uppercase',
            'PAN must be in uppercase',
            value => !value || value === value.toUpperCase()
        )
        .test('length', 'PAN must be 10 characters', value => !value || value.length === 10)
        .matches(/[A-Z]{5}[0-9]{4}[A-Z]{1}/, {
            message: 'Invalid PAN format',
            excludeEmptyString: true,
        }),

    cinDoc: Yup.string().nullable(),
    gstDoc: Yup.string().nullable(),
    panDoc: Yup.string().nullable(),
});

export const changePasswordSchema = Yup.object().shape({
    oldPassword: Yup.string().required('Please enter the current password'),
    newPassword: Yup.string().required('Please enter the new password'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'New and confirm passwords must match')
        .required('Please confirm the new password'),
});
export const verifyGstandPanSchema = Yup.object().shape({
    activity: Yup.string().required('Please enter activity'),
    gstNumber: Yup.string()
        .trim()
        .min(15, 'Minimum 15 characters are required')
        .max(15, 'Maximum 15 characters are allowed')
        .matches(
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
            'Invalid GSTIN format'
        )
        .required('Please enter GSTIN number'),

    panNumber: Yup.string()
        .trim()
        .min(10, 'Minimum 10 characters are required')
        .max(10, 'Maximum 10 characters are allowed')
        .matches(/[A-Z]{5}[0-9]{4}[A-Z]{1}/, 'Invalid PAN format')
        .required('Please enter PAN number'),
    gstDoc: Yup.string().required('Please upload GSTIN certificate '),
    panDoc: Yup.string().required('Please upload pan card '),
});
export const ReferralCodeSchema = Yup.object().shape({
    email: Yup.string()
        .email('Please enter a valid email ID')
        .matches(
            /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email ID'
        )
        .max(40, 'Email id must be at most 40 characters')
        .required('Please enter the email ID'),
});

const isFutureDate = (date: string) => new Date(date).getTime() > new Date().getTime();

export const OneKybValidationSchema = Yup.object().shape({
    Pan_Card: Yup.mixed(),
    Pan_CardExpiry: Yup.string()
        .nullable()
        .when('Pan_Card', {
            is: (val: string) => !!val, // Only validate if Emirates_ID has data
            then: schema =>
                schema.test('is-future-date', 'Expiry date must be a future date', value => {
                    if (!value) return true; // ✅ allow null/empty
                    return isFutureDate(value);
                }),
            otherwise: schema => schema.nullable(),
        }),
    Signing_Authority_Pan_Card: Yup.mixed(),
    Signing_Authority_Pan_CardExpiry: Yup.string()
        .nullable()
        .when('Signing_Authority_Pan_Card', {
            is: (val: string) => !!val,
            then: schema =>
                schema.test('is-future-date', 'Expiry date must be a future date', value => {
                    if (!value) return true;
                    return isFutureDate(value);
                }),
            otherwise: schema => schema.nullable(),
        }),
    Aadhar_Card: Yup.mixed(),
    Aadhar_CardExpiry: Yup.string()
        .nullable()
        .when('Aadhar_Card', {
            is: (val: any) => !!val,
            then: schema =>
                schema.test('is-future-date', 'Expiry date must be a future date', value => {
                    if (!value) return true;
                    return isFutureDate(value);
                }),
            otherwise: schema => schema.nullable(),
        }),
    GST_Certificate: Yup.mixed(),
    GST_CertificateExpiry: Yup.string()
        .nullable()
        .when('GST_Certificate', {
            is: (val: any) => !!val,
            then: schema =>
                schema.test('is-future-date', 'Expiry date must be a future date', value => {
                    if (!value) return true;
                    return isFutureDate(value);
                }),
            otherwise: schema => schema.nullable(),
        }),
    Bank_Proof: Yup.mixed(),
    Bank_ProofExpiry: Yup.string()
        .nullable()
        .when('Bank_Proof', {
            is: (val: any) => !!val,
            then: schema =>
                schema.test('is-future-date', 'Expiry date must be a future date', value => {
                    if (!value) return true;
                    return isFutureDate(value);
                }),
            otherwise: schema => schema.nullable(),
        }),
    MOA_AOA: Yup.mixed(),
    MOA_AOAExpiry: Yup.string()
        .nullable()
        .when('MOA_AOA', {
            is: (val: any) => !!val,
            then: schema =>
                schema.test('is-future-date', 'Expiry date must be a future date', value => {
                    if (!value) return true;
                    return isFutureDate(value);
                }),
            otherwise: schema => schema.nullable(),
        }),
    Corporate_Agreement: Yup.mixed(),
    Corporate_AgreementExpiry: Yup.string()
        .nullable()
        .when('Corporate_Agreement', {
            is: (val: any) => !!val,
            then: schema =>
                schema.test('is-future-date', 'Expiry date must be a future date', value => {
                    if (!value) return true;
                    return isFutureDate(value);
                }),
            otherwise: schema => schema.nullable(),
        }),
    Certificate_Of_Incorporation: Yup.mixed(),
    Certificate_Of_IncorporationExpiry: Yup.string()
        .nullable()
        .when('Certificate_Of_Incorporation', {
            is: (val: any) => !!val,
            then: schema =>
                schema.test('is-future-date', 'Expiry date must be a future date', value => {
                    if (!value) return true;
                    return isFutureDate(value);
                }),
            otherwise: schema => schema.nullable(),
        }),
    Establishment_License: Yup.mixed(),
    Establishment_LicenseExpiry: Yup.string()
        .nullable()
        .when('Establishment_License', {
            is: (val: any) => !!val,
            then: schema =>
                schema.test('is-future-date', 'Expiry date must be a future date', value => {
                    if (!value) return true;
                    return isFutureDate(value);
                }),
            otherwise: schema => schema.nullable(),
        }),
    Proof_Of_Business: Yup.object().shape({
        fileBase: Yup.string()
            .required('Please enter a valid business proof link starting with http:// or https://')
            .test(
                'no-edge-whitespace',
                'Proof of business cannot start or end with whitespace',
                value => value == null || (!/^\s/.test(value) && !/\s$/.test(value))
            )
            .test(
                'no-multiple-whitespace',
                'Proof of business cannot contain consecutive whitespaces',
                value => value == null || !/\s{2,}/.test(value)
            )
            .test(
                'not-only-whitespace',
                'Proof of business cannot be only whitespace',
                value => value == null || !/^\s*$/.test(value)
            )
            .min(3, 'Proof of business must be at least 3 characters'),
        fileFormat: Yup.string().nullable(),
    }),

    Nature_Of_Business: Yup.object().shape({
        fileBase: Yup.string()
            .required('Please enter the nature of business')
            .test(
                'no-edge-whitespace',
                'Nature of business cannot start or end with whitespace',
                value => value == null || (!/^\s/.test(value) && !/\s$/.test(value))
            )
            .test(
                'no-multiple-whitespace',
                'Nature of business cannot contain consecutive whitespaces',
                value => value == null || !/\s{2,}/.test(value)
            )
            .test(
                'not-only-whitespace',
                'Nature of business cannot be only whitespace',
                value => value == null || !/^\s*$/.test(value)
            )
            .min(3, 'Nature of business must be at least 3 characters'),
        fileFormat: Yup.string().nullable(),
    }),
});
