// @ts-nocheck

import dayjs from 'dayjs';
import * as Yup from 'yup';

import { passportRegex } from '@utils/regex';

export const travellerDataWeb = Yup.object().shape({
    nameTitle: Yup.string().required('Select'),
    firstName: Yup.string()
        .min(3, 'First name must be at least 3 characters')
        .required('Please enter the first name')
        .test(
            'no-leading-whitespace',
            'First name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'First name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'First name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    lastName: Yup.string()
        .min(2, 'Last name must have at least 2 characters')
        .required('Please enter the last name')
        .test(
            'no-leading-whitespace',
            'Last name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Last name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Last name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    gender: Yup.string().required('Please select gender'),

    passengerType: Yup.string().trim(),
    dob: Yup.date().required('Please select the date of birth'),
    phone: Yup.string()
        .trim()
        .min(9, 'Mobile number must be at least 9 digits')
        .max(10, 'Mobile must be at most 10 digits')
        .required('Please enter the mobile number'),
    phoneCode: Yup.string().trim().required('Mobile code is required'),
    email: Yup.string()
        .email('Please enter a valid email ID')
        .matches(
            /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email ID'
        )
        .required('Please enter the email ID'),
    isPassportRequired: Yup.boolean(),

    passportNo: Yup.string().when('isPassportRequired', {
        is: (passportRequired: boolean) => passportRequired === true,
        then: schema =>
            schema
                .required('Please enter the passport number')
                .matches(
                    /^[A-Z0-9]*$/, // This regex ensures that no spaces or special characters.
                    'No special characters or spaces are allowed.'
                )
                .min(6, 'Passport number must be at least 6 characters long'),
        otherwise: schema => schema,
    }),
    issuedCountry: Yup.string().when('isPassportRequired', {
        is: (passportRequired: boolean) => passportRequired === true,
        then: schema => schema.required('Please select the issued country'),
        otherwise: schema => schema,
    }),
    residenceCountryCode: Yup.string().when('isPassportRequired', {
        is: (passportRequired: boolean) => passportRequired === true,
        then: schema => schema.required('Please select the nationality'),
        otherwise: schema => schema,
    }),
    expiryDate: Yup.string().when('isPassportRequired', {
        is: (passportRequired: boolean) => passportRequired === true,
        then: schema =>
            schema
                .required('Please select the expiry date')
                .test(
                    'is-future-date',
                    'Expiry date must be in the future',
                    value => !!value && dayjs(value).isAfter(dayjs())
                ),
        otherwise: schema =>
            schema
                .nullable()
                .test(
                    'is-future-date',
                    'Expiry date must be in the future',
                    value => !value || dayjs(value).isAfter(dayjs())
                ),
    }),
});

export const travellerData = Yup.object().shape({
    firstName: Yup.string()
        .min(3, 'First name must be at least 3 characters')
        .required('Please enter the first name')
        .test(
            'no-leading-whitespace',
            'First name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'First name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'First name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    lastName: Yup.string()
        .min(2, 'Last name must have at least 2 characters')
        .required('Please enter the last name')
        .test(
            'no-leading-whitespace',
            'Last name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Last name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Last name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    gender: Yup.string().trim().required('Please select gender'),
    passportNo: Yup.string()
        .trim()
        .ensure()
        .when('isPassportRequired', {
            is: true,
            then: Yup.string().required('Please enter passport no'),
        }),
    passengerType: Yup.string().trim(),
    isPassportRequired: Yup.boolean(),
    issuedCountry: Yup.string()
        .trim()
        .ensure()
        .when('isPassportRequired', {
            is: true,
            then: Yup.string().required('Please enter Issued country'),
        }),
    dob: Yup.date().required('Please enter the date of birth'),
    phone: Yup.string()
        .trim()
        .min(9, 'Mobile number must be at least 9 digits')
        .max(10, 'Mobile must be at most 10 digits')
        .required('Please enter the mobile number'),
    phoneCode: Yup.string().trim().required('Mobile code is required'),
    email: Yup.string()
        .email('Please enter a valid email id')
        .matches(
            /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email id'
        )
        .required('Please enter the email id'),
    expiryDate: Yup.string()
        .trim()
        .ensure()
        .when('isPassportRequired', {
            is: true,
            then: Yup.string()
                .required('Please enter passport expiry')
                .test('expiry', 'Passport has expired', value => {
                    const today = new Date();
                    return value > today;
                }),
        }),
});

export const travellerEditData = Yup.object().shape({
    firstName: Yup.string()
        .min(3, 'First name must be at least 3 characters')
        .required('Please enter the first name')
        .test(
            'no-leading-whitespace',
            'First name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'First name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'First name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    lastName: Yup.string()
        .min(2, 'Last name must have at least 2 characters')
        .required('Please enter the last name')
        .test(
            'no-leading-whitespace',
            'Last name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Last name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Last name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    gender: Yup.string().trim().required('Please select gender'),
    passportNo: Yup.string()
        .trim()
        .ensure()
        .when('isPassportRequired', {
            is: true,
            then: Yup.string().required('Please enter passport no'),
        }),
    passengerType: Yup.string().trim(),
    isPassportRequired: Yup.boolean(),
    issuedCountry: Yup.string()
        .trim()
        .ensure()
        .when('isPassportRequired', {
            is: true,
            then: Yup.string().required('Please enter Issued country'),
        }),
    dob: Yup.date().required('Please enter the date of birth'),

    expiryDate: Yup.string()
        .trim()
        .ensure()
        .when('isPassportRequired', {
            is: true,
            then: Yup.string()
                .required('Please enter passport expiry')
                .test('expiry', 'Passport has expired', value => {
                    const today = new Date();
                    return value > today;
                }),
        }),
});

function whitespaceValidation(validation, field) {
    return validation
        .test(
            'no-leading-or-trailing-whitespace',
            `${field} cannot start or end with a blank space`,
            value => !value || (!/^\s/.test(value) && !/\s$/.test(value)) // Check if starts or ends with whitespace
        )
        .test(
            'no-multiple-whitespace',
            `${field} cannot contain consecutive whitespaces`,
            value => !value || !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            `${field} cannot be only whitespace`,
            value => !value || !/^\s*$/.test(value)
        );
}

export const passengerValidation = (
    isPassportRequired,
    IsPassportFullDetailRequiredAtBook,
    isPanRequired,
    idDObRequired,
    departureDate?: string | null
) => {
    const validation = Yup.object().shape({
        Title: Yup.string().required('Select'),
        FirstName: whitespaceValidation(
            Yup.string()
                .min(3, 'First name must be at least 3 characters')
                .required('Please enter the first name'),
            'First name'
        ),
        LastName: whitespaceValidation(
            Yup.string()
                .min(2, 'Last name must be at least 2 characters')
                .required('Please enter the last name'),
            'Last name'
        ),
        PaxType: Yup.number()
            .oneOf([1, 2, 3], 'Invalid passenger type')
            .required('Passenger type missing'),
        DateOfBirth: Yup.string().when([], {
            is: () => idDObRequired,
            then: schema => schema.required('Please select the date of birth'),
            otherwise: schema => schema.notRequired(),
        }),
        Gender: Yup.number().required('Gender is missing'),
        PassportNo: Yup.string()
            .matches(
                /^[A-Za-z0-9]*$/, // This regex ensures that no spaces or special characters.
                'No special characters or spaces are allowed.'
            )
            .min(6, 'Passport number must be at least 6 characters long')
            .when([], {
                is: () => isPassportRequired,
                then: schema =>
                    schema
                        .required('Please enter the passport number')
                        .matches(
                            passportRegex,
                            'Please enter a valid passport number'
                        ),
                otherwise: schema =>
                    schema
                        .notRequired()
                        .test(
                            'optional-passport-format',
                            'Please enter a valid passport number',
                            value => !value || passportRegex.test(value)
                        ),
            }),
        PassportExpiry: Yup.string().when([], {
            is: () => isPassportRequired,
            then: schema =>
                schema
                    .required('Please select the expiry date')
                    .test(
                        'passport-expiry-after-departure',
                        departureDate
                            ? `Passport expiry date must be on or after ${dayjs(departureDate).format('D MMM YYYY')} to cover the selected travel dates`
                            : 'Passport expiry date must be in the future',
                        value => {
                            if (!value) return false;
                            if (departureDate) {
                                return !dayjs(value).isBefore(dayjs(departureDate), 'day');
                            }
                            return dayjs(value).isAfter(dayjs());
                        }
                    ),
            otherwise: schema => schema.notRequired(),
        }),
        PassportIssueDate: Yup.string().when([], {
            is: () => IsPassportFullDetailRequiredAtBook,
            then: schema => schema.required('Passport issued date is required'),
            otherwise: schema => schema.notRequired(),
        }),
        AddressLine1: whitespaceValidation(
            Yup.string()
                .min(3, 'Address line 1 must be at least 3 characters')
                .required('Please enter the address line 1'),
            'Address line 1'
        ),
        AddressLine2: whitespaceValidation(
            Yup.string().min(3, 'Address line 2 must be at least 3 characters'),
            'Address line 2'
        ),
        City: whitespaceValidation(
            Yup.string()
                .min(3, 'City must be at least 3 characters')
                .required('Please enter the city'),
            'City'
        ),
        ContactNo: Yup.string()
            .trim()
            .min(10, 'Mobile number must be 10 digits')
            .required('Please enter the mobile number'),
        Email: Yup.string()
            .email('Please enter a valid email ID')
            .matches(
                /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                'Please enter the email ID'
            )
            .required('Please enter the email ID'),
        Nationality: Yup.string().required('Please select nationality'),
        PAN: Yup.string()
            .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Please enter valid pan number')
            .when([], {
                is: () => isPanRequired,
                then: schema => schema.required('Pan number is required.'),
                otherwise: schema => schema.notRequired(),
            }),
    });

    return validation;
};
