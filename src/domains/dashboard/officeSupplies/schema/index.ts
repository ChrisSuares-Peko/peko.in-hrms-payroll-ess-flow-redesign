import * as Yup from 'yup';

import { alphabets } from '@utils/regex';

// Same GSTIN format used by profile/schema/index.ts and Procure/schema/index.ts
const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const addressSchema = Yup.object().shape({
    contactName: Yup.string()
        .required('Please enter the contact name')
        .min(3, 'Contact name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .matches(alphabets, 'Please enter a valid name')
        .test(
            'no-leading-whitespace',
            'Contact name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Contact name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Contact name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    businessName: Yup.string()
        .required('Please enter the business name')
        .min(3, 'Business name must be at least 3 characters')
        .max(100, 'Maximum 100 characters are allowed')
        .test(
            'no-leading-whitespace',
            'Business name cannot start with whitespace',
            value => !/^\s/.test(value)
        )
        .test(
            'no-multiple-whitespace',
            'Business name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        )
        .test(
            'not-only-whitespace',
            'Business name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ),
    noGst: Yup.boolean().default(false),
    gstin: Yup.string().when('noGst', {
        is: true,
        then: schema => schema.notRequired(),
        otherwise: schema =>
            schema
                .required('Please enter the GSTIN')
                .matches(gstinRegex, 'Please enter a valid 15-character GSTIN'),
    }),
    address: Yup.string()
        .required('Please enter the address')
        .min(3, 'Address must be at least 3 characters')
        .max(200, 'Maximum 200 characters are allowed')
        .test(
            'no-leading-whitespace',
            'Address cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Address cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Address cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    // Matches the server rule in purchase/utils/apiValidation.js so the form
    // cannot submit a number the address-save endpoint will reject.
    phoneNumber: Yup.string()
        .required('Please enter the mobile number')
        .trim()
        .matches(/^[6-9][0-9]{9}$/, 'Please enter a valid 10-digit mobile number'),
    // ONDC delivery area_code — sellers quote serviceability/charges against it
    pincode: Yup.string()
        .required('Please enter the pincode')
        .matches(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode'),
});
