import * as yup from 'yup';

import { IFSC_REGEX } from '../types/activateCollectionsTypes';

const accountNumberValidation = yup
    .string()
    .min(9, 'Account number must be between 9 to 18 digits')
    .max(18, 'Account number must be between 9 to 18 digits')
    .matches(/^\d+$/, 'Account number must contain only digits')
    .trim()
    .required('Please enter the Account Number');

const ifscValidation = yup
    .string()
    .trim()
    .required('Please enter the IFSC Code')
    .length(11, 'IFSC code must be 11 characters')
    .test(
        'ifsc-format',
        'Invalid IFSC format (e.g. HDFC0001234)',
        val => !val || IFSC_REGEX.test(val)
    );

export const businessNameSchema = yup.object({
    businessName: yup
        .string()
        .required('Please enter the Business Name')
        .min(3, 'Business name must be at least 3 characters')
        .test(
            'no-leading-or-trailing-whitespace',
            'Business name cannot start or end with whitespace',
            val => val !== undefined && val === val.trim()
        )
        .test(
            'no-consecutive-whitespace',
            'Business name cannot contain consecutive whitespaces',
            val => val !== undefined && !/\s{2,}/.test(val)
        )
        .matches(
            /^[A-Za-z0-9&.\-']+(?: [A-Za-z0-9&.\-']+)*$/,
            "Business name can only contain letters, numbers, &, ., -, ', and single spaces"
        ),
});

export const bankDetailsSchema = yup.object({
    bankName: yup
        .string()
        .required('Please enter the Bank Name')
        .min(3, 'Bank name must be at least 3 characters')
        .test(
            'no-leading-or-trailing-whitespace',
            'Bank name cannot start or end with whitespace',
            val => val !== undefined && val === val.trim()
        )
        .test(
            'no-consecutive-whitespace',
            'Bank name cannot contain consecutive whitespaces',
            val => val !== undefined && !/\s{2,}/.test(val)
        ),
    accountNumber: accountNumberValidation,
    ifsc: ifscValidation,
});

export const bankVerificationSchema = yup.object({
    bankName: yup.string().optional(),
    accountNumber: accountNumberValidation,
    ifsc: ifscValidation,
    accountHolderName: yup
        .string()
        .required('Please enter the Account Holder Name')
        .min(3, 'Account holder name must be at least 3 characters')
        .test(
            'no-leading-or-trailing-whitespace',
            'Account holder name cannot start or end with whitespace',
            val => val !== undefined && val === val.trim()
        )
        .test(
            'no-consecutive-whitespace',
            'Account holder name cannot contain consecutive whitespaces',
            val => val !== undefined && !/\s{2,}/.test(val)
        )
        .matches(
            /^[A-Za-z0-9.&/-]+(?: [A-Za-z0-9.&/-]+)*$/,
            'Please enter a valid account holder name'
        ),
    phone: yup
        .string()
        .required('Please enter the Phone Number')
        .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9'),
   
});
