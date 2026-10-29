import * as Yup from 'yup';

import { PrivacyPolicyItem } from '../hooks/usePrivacyPolicyDetailsApi';

export const loginSchema = Yup.object().shape({
    username: Yup.string()
        .required('Please enter the email ID or account number')
        .matches(/^[a-zA-Z0-9\-_@.']+$/, 'Please enter a valid email ID or account number')
        .test(
            'no-leading-whitespace',
            'Email ID or Account Number cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Email ID or Account Number cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Email ID or Account Number cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    password: Yup.string().required('Please enter the password'),
});

const baseRegisterSteponeSchema = Yup.object().shape({
    contactPersonName: Yup.string()
        .matches(
            /^(?=.*[a-zA-Z])[a-zA-Z .'-]+$/,
            'Please enter a valid full name using letters, spaces, full stops, hyphens and apostrophes'
        )
        .required('Please enter the full name')
        .test(
            'no-leading-or-trailing-whitespace',
            'Full name cannot start or end with whitespace',
            value => value === undefined || value.trim() === value
        )
        .test(
            'no-consecutive-whitespace',
            'Full name cannot contain consecutive whitespaces',
            value => value === undefined || !/\s{2,}/.test(value)
        )
        .test(
            'not-only-whitespace',
            'Name cannot be only whitespace',
            value => value === undefined || !/^\s*$/.test(value)
        )
        .min(3, 'Full name must be at least 3 characters')
        .max(50, 'Full name must be at most 50 characters'),
    name: Yup.string().when(['signupType', 'accountType'], {
        is: (signupType: string, accountType: string) =>
            signupType === 'NEW_COMPANY' || accountType === 'freelancer',
        then: schema => schema.optional(),
        otherwise: schema =>
            schema
                .matches(
                    /^(?=.*[A-Za-z0-9])[A-Za-z0-9&.'\- ]+$/,
                    'Please enter a valid company name using letters, numbers, spaces, full stops, hyphens, apostrophes and &'
                )
                .required('Please enter the company name')
                .min(3, 'Company name must be at least 3 characters')
                .max(50, 'Company name must be at most 50 characters')
                .test(
                    'no-leading-or-trailing-space',
                    'Company name cannot start or end with a blank space.',
                    value => (value ? value === value.trim() : true)
                )
                .test(
                    'no-consecutive-spaces',
                    'Company name cannot contain consecutive blank spaces.',
                    value => (value ? !/\s{2,}/.test(value) : true)
                ),
    }),

    email: Yup.string()
        .email('Please enter a valid business email ID')
        .matches(
            /^[a-zA-Z0-9._%+'-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid business email ID'
        )
        .max(55, 'Business email must be at most 55 characters')
        .required('Please enter the business email ID')
        .test(
            'no-leading-whitespace',
            'Email cannot start with whitespace',
            value => !/^\s/.test(value)
        )
        .test(
            'no-multiple-whitespace',
            'Email cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        )
        .test(
            'not-only-whitespace',
            'Email cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ),

    phonenumber: Yup.string()
        .required('Please enter the mobile number')
        .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),

    state: Yup.string().required('Please select a state'),
});

export const getRegisterSteponeSchema = (privacyPolicyDetails: PrivacyPolicyItem[] = []) => {
    const policyShape = privacyPolicyDetails.reduce(
        (acc, item) => {
            if (item.isMandatory) {
                acc[`policyConsent_${item.id}`] = Yup.boolean().oneOf(
                    [true],
                    item.validationText || 'You must accept this to proceed'
                );
            }
            return acc;
        },
        {} as Record<string, Yup.BooleanSchema>
    );

    return baseRegisterSteponeSchema.concat(Yup.object().shape(policyShape));
};

export const registerStepTwoSchema = Yup.object().shape({
    password: Yup.string()
        .required('Please enter your password')
        .test(
            'no-leading-whitespace',
            'password cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'password cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'password cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ),
    confirmpassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Password and confirm password must match')
        .required('Please confirm your password'),
});

export const socialRegisterCompletionSchema = Yup.object().shape({
    contactPersonName: Yup.string()
        .matches(/^[a-zA-Z ]+$/, 'Please enter a valid full name using only letters')
        .required('Please enter the full name')
        .min(3, 'Full name must be at least 3 characters')
        .test(
            'no-leading-or-trailing-whitespace',
            'Full name cannot start or end with blank space.',
            value => value === undefined || value.trim() === value
        )
        .test(
            'no-consecutive-whitespace',
            'Full name cannot contain consecutive blank spaces.',
            value => value === undefined || !/\s{2,}/.test(value)
        ),
    name: Yup.string()
        .matches(
            /^[a-zA-Z0-9 .&-]+$/,
            'Please enter a valid company name using letters, numbers, spaces, - and &'
        )
        .required('Please enter the company name')
        .min(3, 'Company name must be at least 3 characters')
        .test(
            'no-leading-or-trailing-whitespace',
            'Company name cannot start or end with blank space.',
            value => value === undefined || value.trim() === value
        )
        .test(
            'no-consecutive-whitespace',
            'Company name cannot contain consecutive blank spaces.',
            value => value === undefined || !/\s{2,}/.test(value)
        ),
    mobileNo: Yup.string()
        .required('Please enter the mobile number')
        .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
});

export const forgotPasswordStepfourSchema = Yup.object().shape({
    password: Yup.string()
        .required('Please enter your new password')
        .test(
            'no-leading-whitespace',
            'password cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'password cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'password cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ),

    confirmpassword: Yup.string()
        .oneOf([Yup.ref('password')], 'New and confirm passwords must match')
        .required('Please confirm your new password'),
});
export const forgotPasswordStepOneSchema = Yup.object().shape({
    username: Yup.string()
        .email('Please enter a valid email ID')
        .matches(
            /^[a-zA-Z0-9._%+'-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email ID'
        )
        .max(55, 'Email must be at most 55 characters')
        .required('Please enter the email ID'),
});
export const docSchema = Yup.object().shape({
    gstNumber: Yup.string()
        .trim()
        .min(15, 'Minimum 15 characters are required')
        .max(15, 'Maximum 15 characters are allowed')
        .matches(
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
            'Invalid GSTIN format'
        ),
    panNumber: Yup.string()
        .trim()
        .required('Please enter your pan')
        .min(10, 'Minimum 10 characters are required')
        .max(10, 'Maximum 10 characters are allowed')
        .matches(/[A-Z]{5}[0-9]{4}[A-Z]{1}/, 'Invalid PAN format'),
});

export const panGstValidationSchema = (documentType: 'pan' | 'gst') =>
    Yup.object({
        documentName: Yup.string()
            .required(`Please enter your ${documentType === 'pan' ? 'PAN' : 'GST number'}`)
            .test(
                'no-spaces',
                `${documentType.toUpperCase()} number should not contain spaces`,
                value => !/\s/.test(value ?? '')
            )
            .length(
                documentType === 'pan' ? 10 : 15,
                `${
                    documentType === 'pan' ? 'PAN' : 'GST number'
                } must be ${documentType === 'pan' ? 10 : 15} characters`
            )
            .matches(
                documentType === 'pan'
                    ? /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
                    : /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/,
                `Please enter a valid ${documentType === 'pan' ? 'PAN' : 'GST number'}`
            ),
    });
