import { describe, expect, it } from 'vitest';
import { AnyObjectSchema } from 'yup';

import { trademarkApplicantDetailsSchema, trademarkDetailsSchema } from '../../schema';

const validApplicant = {
    trademarkOwner: '12345',
    entityType: 'Private Limited',
    salutation: 'Mr',
    authorizedPerson: 'John Doe',
    address: '12 MG Road, Bengaluru',
    pincode: '560001',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    country: 'India',
};

const validDetails = {
    brand: 'Peko',
    language: 'English',
    transliterationOfMark: '',
    translationOfMark: '',
    mainGoodsOrService: 'Software',
    trademarkClass: '9',
    description: ['Computer software'],
};

const errorFor = async (schema: AnyObjectSchema, values: object, path: string) => {
    try {
        await schema.validateAt(path, values);
        return undefined;
    } catch (err) {
        return (err as Error).message;
    }
};

describe('trademarkApplicantDetailsSchema', () => {
    it('accepts valid applicant details', async () => {
        await expect(trademarkApplicantDetailsSchema.isValid(validApplicant)).resolves.toBe(true);
    });

    it.each([
        ['trademarkOwner', 'Please select the Trademark Owner'],
        ['entityType', 'Please enter the entity type'],
        ['salutation', 'Please select a salutation'],
        ['authorizedPerson', 'Please enter the authorized person'],
        ['address', 'Please enter the address'],
        ['pincode', 'Please enter the PIN code'],
        ['state', 'Please enter the state'],
        ['district', 'Please enter the district'],
        ['country', 'Please enter the country'],
    ])('requires %s', async (field, message) => {
        expect(await errorFor(trademarkApplicantDetailsSchema, { ...validApplicant, [field]: undefined }, field)).toBe(message);
    });

    it('rejects authorized person with leading/trailing whitespace', async () => {
        expect(await errorFor(trademarkApplicantDetailsSchema, { ...validApplicant, authorizedPerson: ' John' }, 'authorizedPerson')).toBe(
            'Authorized Person cannot start or end with a blank space'
        );
    });

    it('rejects authorized person with digits or symbols', async () => {
        expect(await errorFor(trademarkApplicantDetailsSchema, { ...validApplicant, authorizedPerson: 'John1' }, 'authorizedPerson')).toBe(
            'Please enter a valid name'
        );
    });

    it.each(['123456', '@@@@@', 'aaaaaaa street'])('rejects invalid address "%s"', async (address) => {
        expect(await errorFor(trademarkApplicantDetailsSchema, { ...validApplicant, address }, 'address')).toBe('Please enter a valid address');
    });

    it.each(['056001', '56001', '5600011', 'abcdef'])('rejects invalid pincode "%s"', async (pincode) => {
        expect(await errorFor(trademarkApplicantDetailsSchema, { ...validApplicant, pincode }, 'pincode')).toBe(
            'Please enter a valid 6-digit PIN code'
        );
    });

    it.each([
        ['state', 'Please enter a valid state'],
        ['district', 'Please enter a valid district'],
        ['country', 'Please enter a valid country'],
    ])('rejects non-alphabetic %s', async (field, message) => {
        expect(await errorFor(trademarkApplicantDetailsSchema, { ...validApplicant, [field]: 'Kar1' }, field)).toBe(message);
    });
});

describe('trademarkDetailsSchema', () => {
    it('accepts valid English trademark details without transliteration/translation', async () => {
        await expect(trademarkDetailsSchema.isValid(validDetails)).resolves.toBe(true);
    });

    it.each([
        ['brand', 'Please enter the brand name'],
        ['language', 'Please select a language'],
        ['mainGoodsOrService', 'Please enter the main goods or service'],
        ['trademarkClass', 'Please select a class'],
    ])('requires %s', async (field, message) => {
        expect(await errorFor(trademarkDetailsSchema, { ...validDetails, [field]: undefined }, field)).toBe(message);
    });

    it('requires at least one description', async () => {
        expect(await errorFor(trademarkDetailsSchema, { ...validDetails, description: [] }, 'description')).toBe(
            'Please select at least one description'
        );
    });

    it('requires transliteration and translation for a non-English language', async () => {
        const values = { ...validDetails, language: 'Hindi' };
        expect(await errorFor(trademarkDetailsSchema, values, 'transliterationOfMark')).toBe(
            'Please enter the transliteration of the mark'
        );
        expect(await errorFor(trademarkDetailsSchema, values, 'translationOfMark')).toBe('Please enter the translation of the mark');
    });

    it('accepts a non-English language once transliteration and translation are filled', async () => {
        await expect(
            trademarkDetailsSchema.isValid({
                ...validDetails,
                language: 'Hindi',
                transliterationOfMark: 'Peko',
                translationOfMark: 'Peko',
            })
        ).resolves.toBe(true);
    });
});
