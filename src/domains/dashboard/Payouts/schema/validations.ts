import * as Yup from 'yup';

export const nameValidation = (requiredMessage: string, fieldName: string) =>
    Yup.string()
        .required(requiredMessage)
        .min(3, `${fieldName} must be at least 3 characters`)
        .test('no-leading-space', `${fieldName} cannot start with a whitespace`, value => !value || !value.startsWith(' '))
        .test('no-trailing-space', `${fieldName} cannot end with a whitespace`, value => !value || !value.endsWith(' '))
        .test('no-consecutive-spaces', `${fieldName} cannot contain consecutive whitespaces`, value => !value || !/ {2,}/.test(value));

export const optionalNameValidation = (fieldName: string) =>
    Yup.string()
        .optional()
        .min(3, `${fieldName} must be at least 3 characters`)
        .test('no-leading-space', `${fieldName} cannot start with a whitespace`, value => !value || !value.startsWith(' '))
        .test('no-trailing-space', `${fieldName} cannot end with a whitespace`, value => !value || !value.endsWith(' '))
        .test('no-consecutive-spaces', `${fieldName} cannot contain consecutive whitespaces`, value => !value || !/ {2,}/.test(value));

export const panValidation = Yup.string()
    .optional()
    .test('pan-format', 'Please enter a valid PAN number (e.g. ABCDE1234F)', value => !value || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value));
export const phoneValidation = Yup.string()
    .optional()
    .test('phone-format', 'Please enter a valid 10 digit mobile number starting with 9, 8, 7 or 6', value => !value || /^[6-9][0-9]{9}$/.test(value));
export const addressValidation = Yup.string()
    .optional()
    .test('min-length', 'Address must be at least 3 characters', value => !value || value.length >= 3)
    .test('no-leading-space', 'Address cannot start with a whitespace', value => !value || !value.startsWith(' '))
    .test('no-trailing-space', 'Address cannot end with a whitespace', value => !value || !value.endsWith(' '))
    .test('no-consecutive-spaces', 'Address cannot contain consecutive whitespaces', value => !value || !/ {2,}/.test(value));
