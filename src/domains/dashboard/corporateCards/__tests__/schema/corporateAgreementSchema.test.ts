import { describe, it, expect } from 'vitest';

import { AGREEMENT_MAX, corporateAgreementSchema } from '../../schema/corporateAgreementSchema';
import { AGREEMENT_LABELS as L } from '../../utils/kybData';

const addressProofError = async (
    schema: ReturnType<typeof corporateAgreementSchema>,
    values: object
) => {
    try {
        await schema.validateAt('addressProof', values);
        return null;
    } catch (error) {
        return (error as Error).message;
    }
};

describe('corporateAgreementSchema — address proof', () => {
    it('requires it when nothing has been uploaded yet', async () => {
        const message = await addressProofError(corporateAgreementSchema(), { addressProof: null });

        expect(message).toBe(`Please upload the ${L.addressProof}.`);
    });

    it('accepts a freshly chosen file', async () => {
        const message = await addressProofError(corporateAgreementSchema(), {
            addressProof: { base64: 'abc', format: 'pdf', name: 'proof.pdf' },
        });

        expect(message).toBeNull();
    });

    it('does not ask again for one already stored on the server', async () => {
        const message = await addressProofError(corporateAgreementSchema(true), {
            addressProof: null,
        });

        expect(message).toBeNull();
    });

    it('stops requiring it when the address is declared the same as the GST certificate', async () => {
        const message = await addressProofError(corporateAgreementSchema(), {
            addressProof: null,
            addressProofSameAsGst: true,
        });

        expect(message).toBeNull();
    });

    it('requires it again when the declaration is unticked', async () => {
        const message = await addressProofError(corporateAgreementSchema(), {
            addressProof: null,
            addressProofSameAsGst: false,
        });

        expect(message).toBe(`Please upload the ${L.addressProof}.`);
    });
});

const fieldError = async (field: string, value: unknown, values: object = {}) => {
    try {
        await corporateAgreementSchema().validateAt(field, { [field]: value, ...values });
        return null;
    } catch (error) {
        return (error as Error).message;
    }
};

describe('corporateAgreementSchema — free-text validation', () => {
    it('requires the field', async () => {
        expect(await fieldError('entityName', '')).toBe(`Please enter the ${L.entityName}`);
    });

    it('enforces a minimum length', async () => {
        expect(await fieldError('entityName', 'ab')).toBe(
            `${L.entityName} must be at least 3 characters`
        );
    });

    it('enforces a maximum length', async () => {
        expect(await fieldError('entityName', 'a'.repeat(151))).toBe(
            `${L.entityName} cannot exceed 150 characters`
        );
    });

    it('rejects a leading space', async () => {
        expect(await fieldError('entityName', ' Acme Pvt Ltd')).toBe(
            `${L.entityName} cannot start with whitespace`
        );
    });

    // This is the one that a stray .trim() would silently make unreachable.
    it('rejects a trailing space', async () => {
        expect(await fieldError('entityName', 'Acme Pvt Ltd ')).toBe(
            `${L.entityName} cannot end with whitespace`
        );
    });

    it('rejects consecutive spaces', async () => {
        expect(await fieldError('entityName', 'Acme  Pvt Ltd')).toBe(
            `${L.entityName} cannot contain consecutive whitespaces`
        );
    });

    // A tab must count as whitespace, not only a literal space.
    it('rejects a trailing tab', async () => {
        expect(await fieldError('entityName', 'Acme Pvt Ltd\t')).toBe(
            `${L.entityName} cannot end with whitespace`
        );
    });

    it('rejects a leading tab', async () => {
        expect(await fieldError('entityName', '\tAcme Pvt Ltd')).toBe(
            `${L.entityName} cannot start with whitespace`
        );
    });

    it('rejects a space followed by a tab as consecutive whitespace', async () => {
        expect(await fieldError('entityName', 'Acme \tPvt Ltd')).toBe(
            `${L.entityName} cannot contain consecutive whitespaces`
        );
    });

    it('accepts a clean value', async () => {
        expect(await fieldError('entityName', 'Acme Payments Pvt Ltd')).toBeNull();
    });

    it('applies the same rules to addresses and contact names', async () => {
        expect(await fieldError('regAddress', 'MG Road  Bengaluru')).toBe(
            `${L.regAddress} cannot contain consecutive whitespaces`
        );
        expect(await fieldError('signatoryName', 'Aarav ')).toBe(
            `${L.signatoryName} cannot end with whitespace`
        );
    });

    // Goa, Diu and similar are legitimately short, so city keeps a lower floor than a name.
    it('allows a two-character city but still rejects one character', async () => {
        expect(await fieldError('regCity', 'Goa')).toBeNull();
        expect(await fieldError('regCity', 'X')).toBe(`${L.regCity} must be at least 2 characters`);
    });
});

describe('corporateAgreementSchema — CIN / LLP number', () => {
    const invalid = `Please enter a valid ${L.cinLlpNumber}`;

    it('stays optional, because not every entity has one', async () => {
        expect(await fieldError('cinLlpNumber', '')).toBeNull();
        expect(await fieldError('cinLlpNumber', null)).toBeNull();
        expect(await fieldError('cinLlpNumber', undefined)).toBeNull();
    });

    it('accepts a well-formed CIN', async () => {
        expect(await fieldError('cinLlpNumber', 'U63030KA2011PTC098765')).toBeNull();
        expect(await fieldError('cinLlpNumber', 'L17110MH1973PLC019786')).toBeNull();
    });

    it('accepts an LLP identification number, with or without the hyphen', async () => {
        expect(await fieldError('cinLlpNumber', 'AAB-1234')).toBeNull();
        expect(await fieldError('cinLlpNumber', 'AAB1234')).toBeNull();
    });

    it('rejects free text, which the field used to accept', async () => {
        expect(await fieldError('cinLlpNumber', 'not a real number')).toBe(invalid);
        expect(await fieldError('cinLlpNumber', '12345')).toBe(invalid);
        expect(await fieldError('cinLlpNumber', 'abc')).toBe(invalid);
    });

    it('rejects a CIN of the wrong length', async () => {
        expect(await fieldError('cinLlpNumber', 'U63030KA2011PTC09876')).toBe(invalid);
        expect(await fieldError('cinLlpNumber', 'U63030KA2011PTC0987654')).toBe(invalid);
    });

    it('rejects a CIN that does not start with L or U', async () => {
        expect(await fieldError('cinLlpNumber', 'X63030KA2011PTC098765')).toBe(invalid);
    });
});

describe('corporateAgreementSchema — email fields', () => {
    const EMAIL_FIELDS = [
        ['regEmail', L.regEmail],
        ['officialContactEmail', L.officialContactEmail],
        ['salespersonEmail', L.salespersonEmail],
        ['signatoryEmail', L.signatoryEmail],
    ] as const;

    it.each(EMAIL_FIELDS)('accepts a real address on %s', async field => {
        expect(await fieldError(field, 'accounts@example.co.in')).toBeNull();
    });

    it.each(EMAIL_FIELDS)('rejects a domain with no TLD on %s', async (field, label) => {
        expect(await fieldError(field, 'john@peko')).toBe(`Please enter a valid ${label}`);
    });

    it.each(EMAIL_FIELDS)('rejects a bare word on %s', async (field, label) => {
        expect(await fieldError(field, 'john')).toBe(`Please enter a valid ${label}`);
    });

    it.each(EMAIL_FIELDS)('still requires a value on %s', async (field, label) => {
        expect(await fieldError(field, '')).toBe(`Please enter the ${label}`);
    });
});

/**
 * A saved agreement comes back with null for every column left blank, and the form spreads it over its
 * own defaults. A null on an OPTIONAL field is the dangerous case: it fails Yup's string type check, so
 * the submit is disabled, and the field is never touched so no message ever renders to explain it.
 */
describe('corporateAgreementSchema — a restored agreement', () => {
    const FILLED = {
        entityName: 'Acme Technologies Private Limited',
        regAddress: '221B Baker Street, Andheri East',
        regCity: 'Mumbai',
        regState: 'Maharashtra',
        regPinCode: '400069',
        regTelephone: '02212345678',
        regEmail: 'ops@acme.com',
        billSameAsRegistered: true,
        billAddress: '',
        billCity: '',
        billState: '',
        billPinCode: '',
        gstNumber: '27AAPFU0939F1ZV',
        panNumber: 'AAPFU0939F',
        cinLlpNumber: '',
        tanNumber: '',
        bankName: 'HDFC Bank',
        bankBranch: 'Andheri East',
        bankAccountNumber: '50100123456789',
        bankIfsc: 'HDFC0000123',
        bankCity: 'Mumbai',
        officialContactName: 'Ravi Kumar',
        officialContactMobile: '9876543210',
        officialContactEmail: 'ravi@acme.com',
        salespersonName: 'Priya Nair',
        salespersonMobile: '9876543211',
        salespersonEmail: 'priya@acme.com',
        signatoryName: 'Ravi Kumar',
        signatoryContact: '9876543210',
        signatoryEmail: 'ravi@acme.com',
        signatoryIsPep: false,
        addressProof: null,
    };

    const errorsFor = async (values: object) => {
        try {
            await corporateAgreementSchema(true).validate(values, { abortEarly: false });
            return [];
        } catch (error) {
            return (error as { errors: string[] }).errors;
        }
    };

    it('is valid when every field is filled in', async () => {
        expect(await errorsFor(FILLED)).toEqual([]);
    });

    it('stays valid when the untouched optional fields came back as null', async () => {
        expect(await errorsFor({ ...FILLED, tanNumber: null, cinLlpNumber: null })).toEqual([]);
    });

    it('still rejects a malformed TAN', async () => {
        expect(await errorsFor({ ...FILLED, tanNumber: 'NOTATAN' })).toEqual([
            `Please enter a valid ${L.tanNumber}`,
        ]);
    });

    // The blocker names the field so the tooltip can list something the user can act on.
    it('names a genuinely missing mandatory field rather than failing silently', async () => {
        expect(await errorsFor({ ...FILLED, bankName: '' })).toEqual([
            `Please enter the ${L.bankName}`,
        ]);
    });
});

/**
 * A blank REQUIRED field must say "Please enter the …", not that its format is wrong. Yup reports matches
 * before required, and Formik keeps the first error per field, so without excludeEmptyString an untouched
 * empty field is told to fix a format it has not typed yet — and that wording is what the disabled-button
 * tooltip lists.
 */
describe('corporateAgreementSchema — blank vs malformed', () => {
    const firstError = async (field: string, value: unknown) => {
        try {
            await corporateAgreementSchema(true).validateAt(field, { [field]: value });
            return null;
        } catch (error) {
            return (error as { errors: string[] }).errors[0];
        }
    };

    it.each([
        ['officialContactMobile', L.officialContactMobile],
        ['regPinCode', L.regPinCode],
        ['gstNumber', L.gstNumber],
        ['panNumber', L.panNumber],
        ['bankIfsc', L.bankIfsc],
        ['bankAccountNumber', L.bankAccountNumber],
        ['regTelephone', L.regTelephone],
        ['regEmail', L.regEmail],
    ])('asks for %s rather than complaining about its format', async (field, label) => {
        expect(await firstError(field, '')).toBe(`Please enter the ${label}`);
    });

    it('still reports the format once something has been typed', async () => {
        expect(await firstError('officialContactMobile', '12345')).toBe(
            `Please enter a valid 10-digit ${L.officialContactMobile}`
        );
        expect(await firstError('bankIfsc', 'NOPE')).toBe(`Please enter a valid ${L.bankIfsc}`);
        expect(await firstError('regPinCode', '12')).toBe(`${L.regPinCode} must be 6 digits`);
    });
});

/**
 * The inputs cap typing at these same numbers, so if the rule and the cap ever diverge one of the two is
 * wrong: either the control lets someone type what validation rejects, or it stops them short of what
 * validation would accept.
 */
describe('corporateAgreementSchema — length limits', () => {
    const errorFor = async (field: string, value: string) => {
        try {
            await corporateAgreementSchema(true).validateAt(field, { [field]: value });
            return null;
        } catch (error) {
            return (error as Error).message;
        }
    };

    it.each([
        ['entityName', AGREEMENT_MAX.entityName, L.entityName],
        ['regAddress', AGREEMENT_MAX.address, L.regAddress],
        ['regCity', AGREEMENT_MAX.city, L.regCity],
        ['bankName', AGREEMENT_MAX.bankName, L.bankName],
        ['bankBranch', AGREEMENT_MAX.bankBranch, L.bankBranch],
        ['officialContactName', AGREEMENT_MAX.contactName, L.officialContactName],
        ['signatoryName', AGREEMENT_MAX.contactName, L.signatoryName],
    ])('accepts %s at exactly its cap and rejects one more', async (field, max, label) => {
        expect(await errorFor(field, 'A'.repeat(max))).toBeNull();
        expect(await errorFor(field, 'A'.repeat(max + 1))).toBe(
            `${label} cannot exceed ${max} characters`
        );
    });

    // Emails had no stated maximum at all, so a 300-character address reached a VARCHAR(255) column.
    it('caps an email at the width of its column', async () => {
        const local = 'a'.repeat(AGREEMENT_MAX.email - '@example.com'.length);
        expect(await errorFor('regEmail', `${local}@example.com`)).toBeNull();
        expect(await errorFor('regEmail', `${local}x@example.com`)).toBe(
            `${L.regEmail} cannot exceed ${AGREEMENT_MAX.email} characters`
        );
    });
});
