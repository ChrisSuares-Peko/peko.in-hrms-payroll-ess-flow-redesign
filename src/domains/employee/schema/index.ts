import * as Yup from 'yup';

import { indianMobileRegex } from '@utils/regex';

export const noSurroundingSpaces = (label: string) =>
    Yup.string()
        .test(
            'no-leading-space',
            `${label} cannot start with a blank space`,
            v => !v || !/^\s/.test(v)
        )
        .test(
            'no-trailing-space',
            `${label} cannot end with a blank space`,
            v => !v || !/\s$/.test(v)
        )
        .test(
            'no-consecutive-spaces',
            `${label} cannot contain consecutive blank spaces`,
            v => !v || !/\s{2,}/.test(v)
        );

export const onboardingBankSchema = Yup.object().shape({
    accountName: noSurroundingSpaces('Account holder name')
        .min(3, 'Account holder name must be at least 3 characters')
        .max(100, 'Account holder name cannot exceed 100 characters')
        .required('Please enter the account holder name'),
    bankName: noSurroundingSpaces('Bank name')
        .min(3, 'Bank name must be at least 3 characters')
        .required('Please enter your bank name'),
    accountNumber: Yup.string()
        .required('Please enter your account number')
        .matches(/^\d+$/, 'Account number must contain only digits')
        .min(9, 'Account number must be at least 9 digits')
        .max(18, 'Account number cannot be more than 18 digits'),
    // Indian IFSC format: 4 letters, a 0, then 6 alphanumeric characters.
    ifscCode: Yup.string()
        .transform(value => (value ? value.replace(/\s+/g, '').toUpperCase() : value))
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code')
        .required('Please enter your IFSC code'),
    upiId: Yup.string()
        .matches(/^[\w.-]+@[\w]+$/, {
            message: 'Please enter a valid UPI ID (e.g., username@paytm)',
            excludeEmptyString: true,
        })
        .optional(),
});

export const onboardingEmergencySchema = Yup.object().shape({
    fullName: noSurroundingSpaces("Contact's full name")
        .min(3, "Contact's full name must be at least 3 characters")
        .required("Please enter the contact's full name"),
    relationship: noSurroundingSpaces('Relationship')
        .test(
            'min-length',
            'Relationship must be at least 3 characters',
            v => !v || v.trim().length >= 3
        )
        .nullable(),
    phone: Yup.string()
        .required("Please enter the contact's phone number")
        .matches(indianMobileRegex, 'Please enter a valid 10-digit mobile number starting with 6–9')
        .test(
            'not-all-same',
            'Mobile number is invalid',
            value => !value || !/^(\d)\1+$/.test(value)
        ),
});
