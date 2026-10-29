import { describe, expect, it } from 'vitest';

import { trademarkApplicantDetailsSchema, trademarkDetailsSchema } from '../../schema';
import { EMPTY_VALUES, STEP_TITLES, STEP_VALIDATION_SCHEMAS, isIndividualEntity } from '../../utils/trademarkForm';

describe('trademarkForm utils', () => {
    it('defines the four registration steps in order', () => {
        expect(STEP_TITLES).toEqual(['Applicant Details', 'Trademark Details', 'Logo Upload', 'Preview']);
    });

    it('maps one validation schema per step, with none for Logo Upload/Preview', () => {
        expect(STEP_VALIDATION_SCHEMAS).toHaveLength(STEP_TITLES.length);
        expect(STEP_VALIDATION_SCHEMAS[0]).toBe(trademarkApplicantDetailsSchema);
        expect(STEP_VALIDATION_SCHEMAS[1]).toBe(trademarkDetailsSchema);
        expect(STEP_VALIDATION_SCHEMAS[2]).toBeUndefined();
        expect(STEP_VALIDATION_SCHEMAS[3]).toBeUndefined();
    });

    it.each([
        ['Individual', true],
        ['  individual  ', true],
        ['INDIVIDUAL', true],
        ['Private Limited', false],
        ['', false],
        [undefined, false],
    ])('isIndividualEntity(%s) -> %s', (constitution, expected) => {
        expect(isIndividualEntity(constitution as string | undefined)).toBe(expected);
    });

    it('starts with blank values, no logo and trademark not in use', () => {
        expect(EMPTY_VALUES.description).toEqual([]);
        expect(EMPTY_VALUES.trademarkInUse).toBe(false);
        expect(EMPTY_VALUES.logo).toBeNull();
        expect(EMPTY_VALUES.logoFormat).toBeUndefined();
        expect(EMPTY_VALUES.brand).toBe('');
    });
});
