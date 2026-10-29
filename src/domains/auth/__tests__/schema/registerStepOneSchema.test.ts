import { describe, expect, it } from 'vitest';

import { forgotPasswordStepOneSchema, getRegisterSteponeSchema, loginSchema } from '../../schema';

const schema = getRegisterSteponeSchema();

const base = {
    contactPersonName: 'Priya Sharma',
    name: 'Peko Technologies',
    email: 'priya@example.com',
    phonenumber: '9876543210',
    state: 'Kerala',
    signupType: 'EXISTING_COMPANY',
    accountType: 'corporate',
};

const fieldError = (field: keyof typeof base, value: string) =>
    schema
        .validateAt(field, { ...base, [field]: value })
        .then(() => null)
        .catch(err => err.message as string);

describe('register step one schema', () => {
    describe('contactPersonName', () => {
        it.each(['Mary-Jane Watson', "Conor O'Neil", 'J.R.R. Tolkien', "Dr. Anne-Marie D'Souza"])(
            'accepts %s',
            async value => {
                expect(await fieldError('contactPersonName', value)).toBeNull();
            }
        );

        it.each(['...', '---', "'''", 'Priya@Sharma', 'Priya123'])('rejects %s', async value => {
            expect(await fieldError('contactPersonName', value)).toBe(
                'Please enter a valid full name using letters, spaces, full stops, hyphens and apostrophes'
            );
        });
    });

    describe('name (company)', () => {
        it.each(["O'Reilly Media", 'Peko Tech. Pvt. Ltd.', 'Tata-Sons & Co', 'ABC Ltd.'])(
            'accepts %s',
            async value => {
                expect(await fieldError('name', value)).toBeNull();
            }
        );

        it.each(['...', "'-.", 'Peko@Tech', 'Peko/Tech'])('rejects %s', async value => {
            expect(await fieldError('name', value)).toBe(
                'Please enter a valid company name using letters, numbers, spaces, full stops, hyphens, apostrophes and &'
            );
        });

        it('is optional for a new company', async () => {
            const result = await schema
                .validateAt('name', { ...base, signupType: 'NEW_COMPANY', name: '' })
                .then(() => null)
                .catch(err => err.message);
            expect(result).toBeNull();
        });
    });

    describe('email', () => {
        it.each(["o'neil@example.com", 'john.doe-x@sub-domain.example.co.in', 'a.b@example.com'])(
            'accepts %s',
            async value => {
                expect(await fieldError('email', value)).toBeNull();
            }
        );

        it.each(['bad@@example.com', 'no-at-sign.com', 'sp ace@example.com'])(
            'rejects %s',
            async value => {
                expect(await fieldError('email', value)).toBe(
                    'Please enter a valid business email ID'
                );
            }
        );
    });
});

describe('login and forgot-password accept an apostrophe in the email', () => {
    it('loginSchema', async () => {
        await expect(
            loginSchema.validateAt('username', { username: "o'neil@example.com", password: 'x' })
        ).resolves.toBe("o'neil@example.com");
    });

    it('forgotPasswordStepOneSchema', async () => {
        await expect(
            forgotPasswordStepOneSchema.validateAt('username', { username: "o'neil@example.com" })
        ).resolves.toBe("o'neil@example.com");
    });
});
