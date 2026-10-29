import * as Yup from 'yup';

export const requiredMessage = (label: string) => `Please enter the ${label}`;

export const selectMessage = (label: string) => `Please select a ${label}`;

export const TEXT_MIN = 3;

export const withWhitespaceRules = (schema: Yup.StringSchema, label: string) =>
    schema
        .test(
            'no-leading-whitespace',
            `${label} cannot start with whitespace`,
            value => !value || !/^\s/.test(value)
        )
        .test(
            'no-trailing-whitespace',
            `${label} cannot end with whitespace`,
            value => !value || !/\s$/.test(value)
        )
        .test(
            'no-multiple-whitespace',
            `${label} cannot contain consecutive whitespaces`,
            value => !value || !/\s{2,}/.test(value)
        );

const sized = (label: string, min: number, max: number) =>
    Yup.string()
        .transform((value: string) => (value === '' ? undefined : value))
        .min(min, `${label} must be at least ${min} characters`)
        .max(max, `${label} cannot exceed ${max} characters`);

export const textField = (label: string, max = 100, min = TEXT_MIN) =>
    withWhitespaceRules(sized(label, min, max), label).required(requiredMessage(label));

export const optionalTextField = (label: string, max = 100) =>
    withWhitespaceRules(
        Yup.string().max(max, `${label} cannot exceed ${max} characters`),
        label
    ).notRequired();
