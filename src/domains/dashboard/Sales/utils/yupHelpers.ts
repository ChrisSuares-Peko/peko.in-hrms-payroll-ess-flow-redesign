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
