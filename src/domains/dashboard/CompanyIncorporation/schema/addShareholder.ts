import * as Yup from 'yup';

import { emailRegex, indianMobileRegex } from '@utils/regex';


export const addShareholderSchema = Yup.object({
    name: Yup.string()
        .required('Please enter the name')
        .test('no-edge-whitespace', 'Name cannot start or end with whitespace', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
        .test('no-consecutive-spaces', 'Name cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
        .test('not-only-whitespace', 'Name cannot be only whitespace', val => !val || val.trim().length > 0)
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain alphabets and spaces'),
    nationality: Yup.string().required('Please select the nationality'),
    email: Yup.string()
        .required('Please enter the email address')
        .email('Please enter a valid email address')
        .matches(emailRegex, 'Please enter a valid email address')
        .test('no-leading-whitespace', 'Email cannot start with whitespace', value => !value || !/^\s/.test(value))
        .test('no-multiple-whitespace', 'Email cannot contain consecutive whitespaces', value => !value || !/\s{2,}/.test(value))
        .test('not-only-whitespace', 'Email cannot be only whitespace', value => !value || !/^\s*$/.test(value)),
    mobile: Yup.string()
        .required('Please enter the mobile number')
        .matches(indianMobileRegex, 'Please enter a valid 10-digit mobile number'),
    panNumber: Yup.string().when('nationality', {
        is: 'Indian',
        then: schema =>
            schema
                .required('Please enter the PAN number')
                .length(10, 'PAN must be exactly 10 characters')
                .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)'),
        otherwise: schema => schema.optional().nullable(),
    }),
    passportNumber: Yup.string().when('nationality', {
        is: (val: string) => Boolean(val && val !== 'Indian'),
        then: schema =>
            schema
                .required('Please enter the passport number')
                .min(5, 'Passport number must be at least 5 characters')
                .max(20, 'Passport number cannot exceed 20 characters')
                .matches(/^[A-Z0-9]+$/, 'Passport number can only contain uppercase letters and digits'),
        otherwise: schema => schema.optional().nullable(),
    }),
});
