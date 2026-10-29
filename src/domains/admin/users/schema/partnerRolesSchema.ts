import * as Yup from 'yup';

import { numbers, alphabets } from '@utils/regex';

const partnerRolesSchema = Yup.object().shape({
    name: Yup.string()
        .required('Please enter the name')
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .matches(alphabets, 'Please enter a valid name')
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
        ), // Not only whitespaces
    username: Yup.string()
        .required('Please enter the username')
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        // .matches(alphabets, 'Please enter a valid name')
        .test(
            'no-leading-whitespace',
            'Username cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Username cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Username cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    email: Yup.string().email('Please enter valid email').required('Please enter email address'),
    mobileNo: Yup.string()
        .min(10, 'Mobile number must be 10 digits')
        .max(10, 'Mobile number must be 10 digits')
        .matches(numbers, 'Please enter a valid mobile number'),
    portalUrl: Yup.string()
        .optional()
        .matches(
            /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
            'Must be a valid URL'
        ),
    state: Yup.string().optional(),
});

export default partnerRolesSchema;
