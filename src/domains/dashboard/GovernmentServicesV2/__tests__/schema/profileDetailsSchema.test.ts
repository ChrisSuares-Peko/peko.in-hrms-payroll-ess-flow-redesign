import { describe, expect, it } from 'vitest';
import { ValidationError } from 'yup';

import { profileDetailsSchema } from '../../schema';

const validProfile = {
    legalBusinessName: 'Peko Technologies Pvt Ltd',
    stateOfRegistration: 'Karnataka',
    name: 'Jane Doe',
    email: 'jane@peko.one',
    phoneNumber: '9876543210',
    pan: 'ABCCE1234F',
    entityType: 'Private Limited Company',
};

const errorAt = async (field: keyof typeof validProfile, value: string) => {
    try {
        await profileDetailsSchema.validateAt(field, { ...validProfile, [field]: value });
        return null;
    } catch (err) {
        return (err as ValidationError).message;
    }
};

const allErrors = async (values: Record<string, string>) => {
    try {
        await profileDetailsSchema.validate(values, { abortEarly: false });
        return [];
    } catch (err) {
        return (err as ValidationError).inner.map((e) => [e.path, e.message]);
    }
};

describe('profileDetailsSchema', () => {
    it('accepts a fully valid trademark registration profile', async () => {
        await expect(profileDetailsSchema.isValid(validProfile)).resolves.toBe(true);
    });

    describe('legalBusinessName', () => {
        it('rejects leading or trailing whitespace', async () => {
            expect(await errorAt('legalBusinessName', ' Peko')).toBe(
                'Legal Business Name cannot start or end with a blank space'
            );
            expect(await errorAt('legalBusinessName', 'Peko ')).toBe(
                'Legal Business Name cannot start or end with a blank space'
            );
        });

        it('enforces a minimum of 3 characters', async () => {
            expect(await errorAt('legalBusinessName', 'Pe')).toBe('Legal Business Name must be at least 3 characters');
            expect(await errorAt('legalBusinessName', 'Pek')).toBeNull();
        });

        it('enforces a maximum of 200 characters', async () => {
            expect(await errorAt('legalBusinessName', 'a'.repeat(201))).toBe('Maximum 200 characters are allowed');
            expect(await errorAt('legalBusinessName', 'a'.repeat(200))).toBeNull();
        });

        it('allows digits and symbols in the business name', async () => {
            expect(await errorAt('legalBusinessName', 'Peko & Co. 24x7')).toBeNull();
        });

        it('reports both the min-length and required errors for an empty value', async () => {
            const errors = await allErrors({ ...validProfile, legalBusinessName: '' });

            expect(errors).toEqual([
                ['legalBusinessName', 'Legal Business Name must be at least 3 characters'],
                ['legalBusinessName', 'Please enter legal business name'],
            ]);
        });

        it('uses the required message when the value is missing entirely', async () => {
            const rest: Record<string, string> = { ...validProfile };
            delete rest.legalBusinessName;

            expect(await allErrors(rest)).toEqual([['legalBusinessName', 'Please enter legal business name']]);
        });
    });

    describe('stateOfRegistration', () => {
        it('is required', async () => {
            expect(await errorAt('stateOfRegistration', '')).toBe('Please select state of registration');
        });
    });

    describe('name', () => {
        it('allows only alphabets and spaces', async () => {
            expect(await errorAt('name', 'Jane D0e')).toBe('Name must contain only alphabets and spaces');
            expect(await errorAt('name', 'Jane-Doe')).toBe('Name must contain only alphabets and spaces');
            expect(await errorAt('name', 'Jane Mary Doe')).toBeNull();
        });

        it('rejects leading or trailing whitespace before other checks', async () => {
            expect(await errorAt('name', ' Jane')).toBe('Name cannot start or end with a blank space');
        });

        it('enforces length between 3 and 100 characters', async () => {
            expect(await errorAt('name', 'Jo')).toBe('Name must be at least 3 characters');
            expect(await errorAt('name', 'a'.repeat(101))).toBe('Maximum 100 characters are allowed');
            expect(await errorAt('name', 'a'.repeat(100))).toBeNull();
        });

        it('reports the regex error first for an empty value', async () => {
            const errors = await allErrors({ ...validProfile, name: '' });

            expect(errors[0]).toEqual(['name', 'Name must contain only alphabets and spaces']);
            expect(errors).toContainEqual(['name', 'Please enter name']);
        });
    });

    describe('email', () => {
        it('validates the email format', async () => {
            expect(await errorAt('email', 'not-an-email')).toBe('Please enter a valid email address');
        });

        it('is required', async () => {
            expect(await errorAt('email', '')).toBe('Please enter email');
        });
    });

    describe('phoneNumber', () => {
        it.each(['5876543210', '987654321', '98765432100', '98765abcde'])('rejects %s', async (phone) => {
            expect(await errorAt('phoneNumber', phone)).toBe(
                'Please enter a valid 10-digit mobile number starting with 6–9'
            );
        });

        it.each(['6000000000', '7123456789', '8123456789', '9123456789'])('accepts %s', async (phone) => {
            expect(await errorAt('phoneNumber', phone)).toBeNull();
        });

        it('reports the format error first for an empty value', async () => {
            const errors = await allErrors({ ...validProfile, phoneNumber: '' });

            expect(errors).toEqual([
                ['phoneNumber', 'Please enter a valid 10-digit mobile number starting with 6–9'],
                ['phoneNumber', 'Please enter phone number'],
            ]);
        });
    });

    describe('pan', () => {
        it.each(['abcce1234f', 'ABCCE1234', 'ABCC12345F', 'ABCCE1234FF', 'ABCCE 1234F'])('rejects %s', async (pan) => {
            expect(await errorAt('pan', pan)).toBe('Please enter a valid PAN (e.g., ABCDE1234F)');
        });

        it('accepts a well-formed uppercase PAN', async () => {
            expect(await errorAt('pan', 'AAAPL1234C')).toBeNull();
        });

        it('reports both the format and required errors for an empty value', async () => {
            const errors = await allErrors({ ...validProfile, pan: '' });

            expect(errors).toEqual([
                ['pan', 'Please enter a valid PAN (e.g., ABCDE1234F)'],
                ['pan', 'Please enter PAN'],
            ]);
        });
    });

    describe('entityType', () => {
        it('is required', async () => {
            expect(await errorAt('entityType', '')).toBe('Please select entity type');
        });
    });

    it('collects errors for every field when the whole form is empty', async () => {
        const errors = await allErrors({
            legalBusinessName: '',
            stateOfRegistration: '',
            name: '',
            email: '',
            phoneNumber: '',
            pan: '',
            entityType: '',
        });
        const paths = new Set(errors.map(([path]) => path));

        expect(paths).toEqual(
            new Set(['legalBusinessName', 'stateOfRegistration', 'name', 'email', 'phoneNumber', 'pan', 'entityType'])
        );
    });
});
