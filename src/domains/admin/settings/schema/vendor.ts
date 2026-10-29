import * as Yup from 'yup';

import { alphabets } from '@utils/regex';

export const vendorData = Yup.object().shape({
    vendorName: Yup.string()
        .required('Please enter the vendor name')
        .matches(alphabets, 'Please enter valid vendor name')
        .min(3, 'Vendor name must be at least 3 characters'),
    type: Yup.string().required('Please select the type'),
    apiUrl: Yup.string().required('Please enter a valid API URL'),
    state: Yup.string(),
    gstNo: Yup.string()
        .trim()
        .uppercase()
        .matches(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])?$/, {
            message: 'Please enter a valid 15-character GSTIN',
            excludeEmptyString: true,
        }),
    address: Yup.string().max(500, 'Address must be at most 500 characters'),
    vendorEmail: Yup.string()
        .required('Please enter at least one email ID')
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:,[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/,
            'Please enter a valid email ID'
        ),
    optionals: Yup.array()
        .of(
            Yup.object().shape({
                key: Yup.string()
                    .trim()
                    .required('Key is required')
                    .test(
                        'no-empty-key',
                        'Key cannot be empty or whitespace',
                        value => value?.trim() !== ''
                    ),
                value: Yup.string()
                    .trim()
                    .required('Value is required')
                    .test(
                        'no-empty-value',
                        'Value cannot be empty or whitespace',
                        value => value?.trim() !== ''
                    ),
            })
        )
        .test(
            'key-value-pair-validation',
            'Key and Value both are required and cannot be empty',
            optionals => {
                if (!optionals || optionals.length === 0) return true;

                return optionals.every(({ key, value }) => {
                    if ((key && !value) || (!key && value)) {
                        return false;
                    }
                    return true;
                });
            }
        ),
});
