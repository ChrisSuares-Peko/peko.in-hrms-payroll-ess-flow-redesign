import { describe, it, expect } from 'vitest';

import { getBasicInfoSchema, getStepSchemas } from '../../schema';
import { EntityType } from '../../types';

// getStepSchemas(PROPRIETORSHIP) = [basicInfo, gstApplicant, gstAddress, gstInfo, documents, null]
type ValidatableSchema = { validate: (v: unknown, o: object) => Promise<unknown> };

const schemas = getStepSchemas(EntityType.PROPRIETORSHIP);
const gstApplicantSchema = schemas[1] as unknown as ValidatableSchema;
const gstAddressSchema = schemas[2] as unknown as ValidatableSchema;
const gstInfoSchema = schemas[3] as unknown as ValidatableSchema;

// Collects the Yup error paths (empty array === valid).
const errorPaths = async (schema: ValidatableSchema, values: unknown): Promise<string[]> => {
    try {
        await schema.validate(values, { abortEarly: false, context: values });
        return [];
    } catch (err) {
        const inner = (err as { inner?: Array<{ path?: string }> }).inner ?? [];
        return inner.map(e => e.path ?? '');
    }
};

describe('gstApplicantSchema (proprietorship — Applicant Details)', () => {
    const validGst = {
        applicantType: 'Proprietor',
        premises: 'Own',
        salutation: 'Mr.',
        authorizedPerson: 'John Doe',
        relationship: 'Proprietor',
        pan: 'ABCDE1234F',
        dob: '1990-01-01',
        mobile: '9876543210',
        email: 'john@example.com',
    };

    it('accepts a fully valid applicant', async () => {
        expect(await errorPaths(gstApplicantSchema, { gst: validGst })).toEqual([]);
    });

    it('requires the relationship (Proprietor / Partner / Witness)', async () => {
        expect(
            await errorPaths(gstApplicantSchema, { gst: { ...validGst, relationship: '' } })
        ).toContain('gst.relationship');
    });

    it('rejects a malformed PAN', async () => {
        expect(
            await errorPaths(gstApplicantSchema, { gst: { ...validGst, pan: 'abcde1234f' } })
        ).toContain('gst.pan');
    });

    it('rejects an under-18 date of birth', async () => {
        expect(
            await errorPaths(gstApplicantSchema, { gst: { ...validGst, dob: '2020-01-01' } })
        ).toContain('gst.dob');
    });
});

describe('gstAddressSchema (proprietorship — Address Details)', () => {
    const validGst = {
        pincode: '110003',
        state: 'Delhi',
        district: 'South Delhi',
        circle: 'Ward 1',
        commissionerate: 'Delhi East',
        division: 'South Ex',
        range: 'Range 1',
        address: '123 Residency Road',
    };

    it('accepts a valid non-Maharashtra address', async () => {
        expect(await errorPaths(gstAddressSchema, { gst: validGst })).toEqual([]);
    });

    it('rejects an all-numeric address — 31567 (must contain a letter)', async () => {
        expect(
            await errorPaths(gstAddressSchema, {
                gst: { ...validGst, address: '00000000000000000' },
            })
        ).toContain('gst.address');
    });

    it('rejects a pincode that starts with 0', async () => {
        expect(
            await errorPaths(gstAddressSchema, { gst: { ...validGst, pincode: '000000' } })
        ).toContain('gst.pincode');
    });

    it('requires electricity board + CA number only for Maharashtra', async () => {
        const mahaPaths = await errorPaths(gstAddressSchema, {
            gst: { ...validGst, state: 'Maharashtra' },
        });
        expect(mahaPaths).toContain('gst.electricityBoard');
        expect(mahaPaths).toContain('gst.caNumber');
        expect(await errorPaths(gstAddressSchema, { gst: validGst })).not.toContain(
            'gst.electricityBoard'
        );
    });
});

describe('gstInfoSchema (proprietorship — GST Information)', () => {
    it('requires at least one business activity and the Rule 14A option', async () => {
        const paths = await errorPaths(gstInfoSchema, {
            gst: { businessActivity: [], rule14a: '' },
        });
        expect(paths).toContain('gst.businessActivity');
        expect(paths).toContain('gst.rule14a');
    });

    it('requires the "others" text only when Others is selected', async () => {
        expect(
            await errorPaths(gstInfoSchema, {
                gst: { businessActivity: ['Others'], rule14a: 'No' },
            })
        ).toContain('gst.businessActivityOthers');
        expect(
            await errorPaths(gstInfoSchema, {
                gst: { businessActivity: ['Retail'], rule14a: 'No' },
            })
        ).not.toContain('gst.businessActivityOthers');
    });
});

describe('getBasicInfoSchema (proprietorship relaxations)', () => {
    const basic = getBasicInfoSchema(EntityType.PROPRIETORSHIP) as unknown as ValidatableSchema;
    const base = {
        primaryContact: { fullName: 'John Doe', email: 'john@example.com', mobile: '9876543210' },
        proposedNames: { first: 'Acme Traders' },
    };

    it('does not require state of incorporation or business activities', async () => {
        const paths = await errorPaths(basic, base);
        expect(paths).not.toContain('stateOfIncorporation');
        expect(paths).not.toContain('businessActivities');
    });

    it('still requires a proposed name with a letter (min length)', async () => {
        expect(await errorPaths(basic, { ...base, proposedNames: { first: '12' } })).toContain(
            'proposedNames.first'
        );
    });
});
