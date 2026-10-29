import * as Yup from 'yup';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

const userSchema = Yup.object().shape({
    contactPersonName: Yup.string().required('Name is required'),
    name: Yup.string().required('Company name is required'),
    email: Yup.string()
        .required('Email is required')
        .matches(emailRegex, 'Please enter valid email address'),
    mobileNo: Yup.string()
        .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number')
        .required('Mobile number is required'),
    designation: Yup.string()
        .min(3, 'Designation name must be at least 3 characters')
        .test('no-multiple-spaces', 'Designation cannot start with space', isStartsWithSpace)
        .test(
            'no-multiple-spaces',
            'Multiple consecutive spaces are not allowed',
            isConsecutiveSpaces
        )
        .required('Please enter the designation name'),
    city: Yup.string()
        .min(3, 'City name must be at least 3 characters')
        .test('no-multiple-spaces', 'City cannot start with space', isStartsWithSpace)
        .test(
            'no-multiple-spaces',
            'Multiple consecutive spaces are not allowed',
            isConsecutiveSpaces
        )
        .required('Please enter the city name'),

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
});

function isConsecutiveSpaces(value: any) {
    if (value && typeof value === 'string') {
        return !/\s{2,}/.test(value);
    }
    return true;
}

function isStartsWithSpace(value: any) {
    if (value && typeof value === 'string') {
        return value[0] !== ' ';
    }
    return true;
}

export const addCorporateSchema = Yup.object().shape({
    contactPersonName: Yup.string()
        .matches(/^[a-zA-Z ]+$/, 'Please enter a valid name')
        .required('Please enter the name')
        .min(3, 'Name must be at least 3 characters')
        .test(
            'no-leading-whitespace',
            'Name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    name: Yup.string()
        .matches(/^[a-zA-Z0-9 .&]+$/, 'Please enter a valid company name')
        .required('Please enter the company name')
        .min(3, 'Company name must be at least 3 characters')
        .test(
            'no-leading-whitespace',
            'Company name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Company name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Company name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    email: Yup.string()
        .required('Please enter the email ID')
        .matches(emailRegex, 'Please enter a valid email ID'),
    // mobileNo: Yup.string()
    //     .matches(/^\d{9}$/, 'Mobile number must be 9 digits')
    //     .required('Please enter the mobile number'),
    mobileNo: Yup.string()
        .required('Please enter the mobile number')
        .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
});
export default userSchema;
