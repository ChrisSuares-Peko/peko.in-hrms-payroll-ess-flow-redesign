import { describe, it, expect } from 'vitest';

import {
    CLOSURE_DETAILS_MAX,
    CLOSURE_DETAILS_MIN,
    CLOSURE_REASON_OTHERS,
    accountClosureSchema,
} from '../../schema/accountClosureSchema';

const validate = async (values: { reason: string; details: string }) => {
    try {
        await accountClosureSchema.validate(values, { abortEarly: false });
        return [];
    } catch (error) {
        return (error as { errors: string[] }).errors;
    }
};

const errorsFor = (details: string, reason = 'NOT_USING') => validate({ reason, details });

describe('accountClosureSchema — additional details', () => {
    describe('length', () => {
        it('rejects details shorter than the minimum', async () => {
            expect(await errorsFor('too short')).toContain(
                `The details must be at least ${CLOSURE_DETAILS_MIN} characters`
            );
        });

        it('accepts details exactly at the minimum', async () => {
            expect(await errorsFor('a'.repeat(CLOSURE_DETAILS_MIN))).toEqual([]);
        });

        it('accepts details exactly at the maximum', async () => {
            expect(await errorsFor('a'.repeat(CLOSURE_DETAILS_MAX))).toEqual([]);
        });

        it('rejects details longer than the maximum', async () => {
            expect(await errorsFor('a'.repeat(CLOSURE_DETAILS_MAX + 1))).toContain(
                `The details cannot exceed ${CLOSURE_DETAILS_MAX} characters`
            );
        });
    });

    describe('whitespace', () => {
        it('rejects a leading space rather than trimming it away', async () => {
            expect(await errorsFor(' Moving to another provider')).toContain(
                'The details cannot start with whitespace'
            );
        });

        it('rejects a trailing space', async () => {
            expect(await errorsFor('Moving to another provider ')).toContain(
                'The details cannot end with whitespace'
            );
        });

        it('rejects consecutive spaces inside the text', async () => {
            expect(await errorsFor('Moving to  another provider')).toContain(
                'The details cannot contain consecutive whitespaces'
            );
        });

        it('accepts single spaces between words', async () => {
            expect(await errorsFor('Moving to another provider')).toEqual([]);
        });

        it('rejects a value made only of spaces', async () => {
            const errors = await errorsFor('    ');

            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('when the field is optional', () => {
        it('accepts an empty value for a non-Others reason', async () => {
            expect(await errorsFor('')).toEqual([]);
        });

        it('does not report a minimum-length error for an empty value', async () => {
            expect(await errorsFor('')).not.toContain(
                `The details must be at least ${CLOSURE_DETAILS_MIN} characters`
            );
        });

        it('still applies the length and whitespace rules once something is typed', async () => {
            expect(await errorsFor(' hi ')).toEqual(
                expect.arrayContaining([
                    'The details cannot start with whitespace',
                    'The details cannot end with whitespace',
                    `The details must be at least ${CLOSURE_DETAILS_MIN} characters`,
                ])
            );
        });
    });

    describe('when the reason is Others', () => {
        it('requires the details', async () => {
            expect(await errorsFor('', CLOSURE_REASON_OTHERS)).toContain(
                'Please tell us a little more about why you are leaving.'
            );
        });

        it('accepts details that satisfy every rule', async () => {
            expect(
                await errorsFor('We are consolidating onto one provider', CLOSURE_REASON_OTHERS)
            ).toEqual([]);
        });

        it('still enforces the minimum', async () => {
            expect(await errorsFor('too short', CLOSURE_REASON_OTHERS)).toContain(
                `The details must be at least ${CLOSURE_DETAILS_MIN} characters`
            );
        });
    });

    it('still requires a reason', async () => {
        expect(await validate({ reason: '', details: '' })).toContain(
            'Please select a reason for leaving.'
        );
    });
});
