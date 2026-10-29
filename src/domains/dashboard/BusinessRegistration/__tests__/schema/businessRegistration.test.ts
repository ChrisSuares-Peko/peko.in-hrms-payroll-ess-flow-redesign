import { describe, it, expect } from 'vitest';

import {
    buildTouched,
    getBasicInfoSchema,
    getStepSchemas,
    personSchema,
    setAllTouched,
} from '../../schema';
import { EntityType } from '../../types';

type ValidatableSchema = { validate: (v: unknown, o: object) => Promise<unknown> };

const errorPaths = async (schema: ValidatableSchema, values: unknown): Promise<string[]> => {
    try {
        await schema.validate(values, { abortEarly: false, context: values });
        return [];
    } catch (err) {
        const inner = (err as { inner?: Array<{ path?: string }> }).inner ?? [];
        return inner.map(e => e.path ?? '');
    }
};

describe('getStepSchemas (per-entity step structure)', () => {
    it('returns the right number of step schemas per entity, with a null final (checkbox-gated) step', () => {
        expect(getStepSchemas(EntityType.PROPRIETORSHIP)).toHaveLength(6);
        expect(getStepSchemas(EntityType.OPC)).toHaveLength(5);
        expect(getStepSchemas(EntityType.PRIVATE_LIMITED)).toHaveLength(5);
        expect(getStepSchemas(EntityType.LLP)).toHaveLength(5);
        expect(getStepSchemas(EntityType.PARTNERSHIP)).toHaveLength(5);

        [
            EntityType.PROPRIETORSHIP,
            EntityType.OPC,
            EntityType.PRIVATE_LIMITED,
            EntityType.LLP,
            EntityType.PARTNERSHIP,
        ].forEach(e => {
            const schemas = getStepSchemas(e);
            expect(schemas[schemas.length - 1]).toBeNull();
            expect(schemas[0]).not.toBeNull();
        });
    });
});

describe('getBasicInfoSchema (company entities require the full set)', () => {
    const base = {
        primaryContact: { fullName: 'John Doe', email: 'john@example.com', mobile: '9876543210' },
        proposedNames: { first: 'Acme' },
    };
    const basic = getBasicInfoSchema(EntityType.PRIVATE_LIMITED) as unknown as ValidatableSchema;

    it('requires state, business activities and description for Private Limited', async () => {
        // businessActivities uses .array().min(1) (no .required()), so an empty
        // array — "nothing selected" — is what triggers the error, not undefined.
        const paths = await errorPaths(basic, { ...base, businessActivities: [] });
        expect(paths).toContain('stateOfIncorporation');
        expect(paths).toContain('businessActivities');
        expect(paths).toContain('businessDescription');
    });

    it('accepts a complete company Basic Info', async () => {
        const complete = {
            ...base,
            stateOfIncorporation: 'Delhi',
            businessActivities: [{ code: '01110' }],
            businessDescription: 'Retail trade of goods',
        };
        expect(await errorPaths(basic, complete)).toEqual([]);
    });

    it('flags a proposed name that repeats an earlier choice', async () => {
        const dup = {
            ...base,
            proposedNames: { first: 'Acme', second: 'Acme' },
            stateOfIncorporation: 'Delhi',
            businessActivities: [{ code: '1' }],
            businessDescription: 'Retail trade of goods',
        };
        expect(await errorPaths(basic, dup)).toContain('proposedNames.second');
    });
});

describe('personSchema (director / promoter / designated-partner KYC)', () => {
    const schema = personSchema as unknown as ValidatableSchema;
    const validPerson = {
        nationality: 'indian',
        pan: 'ABCDE1234F',
        verifiedPan: 'ABCDE1234F',
        residency: 'INDIA',
        birthPlace: 'Delhi',
        birthDistrict: 'South Delhi',
        firstName: 'John',
        lastName: 'Doe',
        fathersName: 'Richard Doe',
        dob: '1990-01-01',
        salutation: 'mr',
        gender: 'male',
        qualification: 'Other',
        occupation: 'Business Owner',
        email: 'john@example.com',
        mobile: '9876543210',
        address: {
            line1: '123 Road',
            pincode: '110003',
            city: 'Delhi',
            state: 'Delhi',
            durationYears: '5',
            durationMonths: '0',
        },
    };

    it('accepts a fully valid Indian director', async () => {
        expect(await errorPaths(schema, validPerson)).toEqual([]);
    });

    it('requires a verified PAN for an Indian director', async () => {
        expect(await errorPaths(schema, { ...validPerson, pan: '', verifiedPan: '' })).toContain(
            'pan'
        );
    });

    it('rejects an under-18 director', async () => {
        expect(await errorPaths(schema, { ...validPerson, dob: '2020-01-01' })).toContain('dob');
    });

    it('requires passport + citizenship (not PAN) for a foreign national', async () => {
        const foreigner = {
            ...validPerson,
            nationality: 'foreign',
            pan: '',
            verifiedPan: '',
            passportNumber: '',
            citizenship: '',
            residency: 'US',
        };
        const paths = await errorPaths(schema, foreigner);
        expect(paths).toContain('passportNumber');
        expect(paths).toContain('citizenship');
        expect(paths).not.toContain('pan');
    });
});

describe('capital / contribution step schemas', () => {
    const llpContribution = getStepSchemas(EntityType.LLP)[2] as unknown as ValidatableSchema;
    const partnershipCapital = getStepSchemas(
        EntityType.PARTNERSHIP
    )[2] as unknown as ValidatableSchema;

    it('LLP: accepts partner contributions that sum to the total (≥ ₹1,000)', async () => {
        expect(
            await errorPaths(llpContribution, {
                totalContribution: 2000,
                directors: [{}, {}],
                contribution: { 0: { amount: 1000 }, 1: { amount: 1000 } },
            })
        ).toEqual([]);
    });

    it('LLP: flags contributions that do not add up to the total', async () => {
        expect(
            await errorPaths(llpContribution, {
                totalContribution: 2000,
                directors: [{}, {}],
                contribution: { 0: { amount: 1000 }, 1: { amount: 500 } },
            })
        ).toContain('totalContribution');
    });

    it('LLP: rejects a total below ₹1,000', async () => {
        expect(
            await errorPaths(llpContribution, {
                totalContribution: 500,
                directors: [{}],
                contribution: { 0: { amount: 500 } },
            })
        ).toContain('totalContribution');
    });

    it('LLP: flags a partner with a zero contribution', async () => {
        expect(
            await errorPaths(llpContribution, {
                totalContribution: 1000,
                directors: [{}, {}],
                contribution: { 0: { amount: 1000 }, 1: { amount: 0 } },
            })
        ).toContain('contribution.1.amount');
    });

    it('Partnership: accepts contributions that sum to the total (> 0)', async () => {
        expect(
            await errorPaths(partnershipCapital, {
                totalContribution: 1500,
                partners: [{}, {}],
                contribution: { 0: { amount: 1000 }, 1: { amount: 500 } },
            })
        ).toEqual([]);
    });
});

describe('setAllTouched / buildTouched', () => {
    it('setAllTouched marks every leaf true (objects + arrays recursed)', () => {
        expect(setAllTouched({ a: 1, b: { c: 2 }, d: [{ e: 3 }] })).toEqual({
            a: true,
            b: { c: true },
            d: [{ e: true }],
        });
    });

    it('buildTouched merges the touched maps of both values and errors', () => {
        expect(buildTouched({ a: 1 }, { b: 'required' })).toEqual({ a: true, b: true });
    });
});
