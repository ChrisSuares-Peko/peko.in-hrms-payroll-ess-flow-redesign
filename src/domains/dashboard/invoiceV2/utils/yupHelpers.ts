import * as Yup from 'yup';

/**
 * Adds no-edge-spaces and no-consecutive-spaces tests to a Yup string schema.
 * @param schema - The Yup string schema to extend.
 * @param label  - Human-readable field name used in error messages (e.g. "Bank name").
 */
export const withSpaceValidation = (schema: Yup.StringSchema, label: string): Yup.StringSchema =>
    schema
        .test(
            'no-edge-spaces',
            `${label} cannot start or end with a blank space`,
            v => !v || !/^\s|\s$/.test(v)
        )
        .test(
            'no-consecutive-spaces',
            `${label} cannot contain consecutive blank spaces`,
            v => !v || !/\s{2,}/.test(v)
        );

/**
 * Requires the field to contain at least one letter (a–z / A–Z).
 * Shows a specific message for numbers-only, special-characters-only, or a mix of both.
 */
export const withLetterRequired = (schema: Yup.StringSchema, label: string): Yup.StringSchema =>
    schema.test({
        name: 'requires-letter',
        message: `${label} cannot contain numbers or special characters only`,
        test(v) {
            if (!v || /[a-zA-Z]/.test(v)) return true;
            const hasDigit = /[0-9]/.test(v);
            const hasSpecial = /[^a-zA-Z0-9\s]/.test(v);
            if (hasDigit && !hasSpecial)
                return this.createError({ message: `${label} cannot contain numbers only` });
            if (!hasDigit && hasSpecial)
                return this.createError({
                    message: `${label} cannot contain special characters only`,
                });
            return this.createError({
                message: `${label} cannot contain numbers or special characters only`,
            });
        },
    });

export const textField = (label: string, required: string): Yup.StringSchema =>
    withLetterRequired(withSpaceValidation(Yup.string().required(required), label), label)
        .min(3, `${label} must be at least 3 characters`)
        .max(100, `${label} must be at most 100 characters`);

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/;

export const withGstinValidation = (schema: Yup.StringSchema): Yup.StringSchema =>
    schema
        .length(15, 'GSTIN must be 15 characters')
        .matches(GSTIN_REGEX, 'Please enter a valid GSTIN');
