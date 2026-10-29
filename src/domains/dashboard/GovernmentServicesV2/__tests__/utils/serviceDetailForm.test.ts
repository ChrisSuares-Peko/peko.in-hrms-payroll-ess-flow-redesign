import { describe, expect, it } from 'vitest';

import { EMPTY_PROFILE_VALUES, ENTITY_TYPE_OPTIONS, deriveEntityTypeFromPan } from '../../utils/serviceDetailForm';

describe('serviceDetailForm', () => {
    describe('EMPTY_PROFILE_VALUES', () => {
        it('starts every profile field blank', () => {
            expect(EMPTY_PROFILE_VALUES).toEqual({
                legalBusinessName: '',
                stateOfRegistration: '',
                name: '',
                email: '',
                phoneNumber: '',
                pan: '',
                entityType: '',
            });
        });
    });

    describe('ENTITY_TYPE_OPTIONS', () => {
        it('exposes the vendor-accepted entity types as label/value pairs', () => {
            expect(ENTITY_TYPE_OPTIONS).toHaveLength(12);
            ENTITY_TYPE_OPTIONS.forEach((option) => expect(option.label).toBe(option.value));
            expect(ENTITY_TYPE_OPTIONS.map((o) => o.value)).toEqual([
                'Private Limited Company',
                'Limited Liability Partnership',
                'One Person Company',
                'Partnership',
                'Proprietorship',
                'Section 8 Company',
                'Public Limited Company',
                'Nidhi Company',
                'Producer Company',
                'Trust',
                'Indian Subsidiary',
                'Partnership Firm',
            ]);
        });

        it('includes every value deriveEntityTypeFromPan can return', () => {
            const values = ENTITY_TYPE_OPTIONS.map((o) => o.value);
            const derived = [
                deriveEntityTypeFromPan('ABCCE1234F', 'X OPC PRIVATE LIMITED'),
                deriveEntityTypeFromPan('ABCCE1234F', 'X PRIVATE LIMITED'),
                deriveEntityTypeFromPan('ABCCE1234F', 'X SECTION 8'),
                deriveEntityTypeFromPan('ABCCE1234F', 'X NIDHI'),
                deriveEntityTypeFromPan('ABCCE1234F', 'X PRODUCER'),
                deriveEntityTypeFromPan('ABCCE1234F', 'X INDIAN SUBSIDIARY'),
                deriveEntityTypeFromPan('ABCCE1234F', 'X LIMITED'),
                deriveEntityTypeFromPan('ABCFE1234F', 'X LLP'),
                deriveEntityTypeFromPan('ABCFE1234F', 'X'),
                deriveEntityTypeFromPan('ABCTE1234F'),
            ];

            derived.forEach((value) => expect(values).toContain(value));
        });
    });

    describe('deriveEntityTypeFromPan', () => {
        describe('company PAN (4th char C)', () => {
            it.each([
                ['PEKO OPC PRIVATE LIMITED', 'One Person Company'],
                ['Peko One Person Company', 'One Person Company'],
                ['PEKO TECHNOLOGIES PRIVATE LIMITED', 'Private Limited Company'],
                ['peko pvt ltd', 'Private Limited Company'],
                ['PEKO PVT. LTD.', 'Private Limited Company'],
                ['PEKO FOUNDATION SECTION 8', 'Section 8 Company'],
                ['PEKO NIDHI LIMITED', 'Nidhi Company'],
                ['PEKO FARMER PRODUCER LIMITED', 'Producer Company'],
                ['PEKO INDIAN SUBSIDIARY', 'Indian Subsidiary'],
                ['PEKO INDUSTRIES LIMITED', 'Public Limited Company'],
                ['PEKO INDUSTRIES LTD', 'Public Limited Company'],
            ])('maps holder name "%s" to %s', (holderName, expected) => {
                expect(deriveEntityTypeFromPan('ABCCE1234F', holderName)).toBe(expected);
            });

            it('returns null when the holder name gives no company hint', () => {
                expect(deriveEntityTypeFromPan('ABCCE1234F', 'PEKO TECHNOLOGIES')).toBeNull();
            });

            it('returns null when no holder name is given', () => {
                expect(deriveEntityTypeFromPan('ABCCE1234F')).toBeNull();
            });

            it('checks Private Limited before Section 8 / Nidhi (current ordering)', () => {
                expect(deriveEntityTypeFromPan('ABCCE1234F', 'PEKO SECTION 8 PRIVATE LIMITED')).toBe(
                    'Private Limited Company'
                );
                expect(deriveEntityTypeFromPan('ABCCE1234F', 'PEKO NIDHI PRIVATE LIMITED')).toBe('Private Limited Company');
            });
        });

        describe('firm PAN (4th char F)', () => {
            it('maps LLP names to Limited Liability Partnership', () => {
                expect(deriveEntityTypeFromPan('ABCFE1234F', 'PEKO LLP')).toBe('Limited Liability Partnership');
                expect(deriveEntityTypeFromPan('ABCFE1234F', 'Peko Limited Liability Partnership')).toBe(
                    'Limited Liability Partnership'
                );
            });

            it('defaults to Partnership Firm otherwise', () => {
                expect(deriveEntityTypeFromPan('ABCFE1234F', 'PEKO AND SONS')).toBe('Partnership Firm');
                expect(deriveEntityTypeFromPan('ABCFE1234F')).toBe('Partnership Firm');
            });
        });

        it('maps a trust PAN (4th char T) to Trust regardless of name', () => {
            expect(deriveEntityTypeFromPan('ABCTE1234F', 'ANYTHING')).toBe('Trust');
        });

        it('treats the 4th character case-insensitively', () => {
            expect(deriveEntityTypeFromPan('abcte1234f')).toBe('Trust');
            expect(deriveEntityTypeFromPan('abcfe1234f')).toBe('Partnership Firm');
        });

        it.each(['ABCPE1234F', 'ABCHE1234F', 'ABCAE1234F', 'ABCBE1234F', 'ABCGE1234F', 'ABCLE1234F', 'ABCJE1234F'])(
            'returns null for other PAN holder types (%s)',
            (pan) => {
                expect(deriveEntityTypeFromPan(pan, 'PEKO PRIVATE LIMITED')).toBeNull();
            }
        );

        it('returns null for an empty or too-short PAN', () => {
            expect(deriveEntityTypeFromPan('')).toBeNull();
            expect(deriveEntityTypeFromPan('ABC')).toBeNull();
        });
    });
});
