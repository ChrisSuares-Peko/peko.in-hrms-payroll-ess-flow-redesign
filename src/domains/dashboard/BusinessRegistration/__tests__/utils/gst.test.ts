import { describe, it, expect } from 'vitest';

import { RELATIONSHIP_OPTIONS, RULE_14A_OPTIONS, isMaharashtra } from '../../utils/gst';

describe('isMaharashtra (drives the GST address electricity-board/CA-number rule)', () => {
    it('matches case-insensitively and as a substring', () => {
        expect(isMaharashtra('Maharashtra')).toBe(true);
        expect(isMaharashtra('MAHARASHTRA')).toBe(true);
        expect(isMaharashtra('maharashtra state')).toBe(true);
    });

    it('is false for other states and for missing input', () => {
        expect(isMaharashtra('Tamil Nadu')).toBe(false);
        expect(isMaharashtra(undefined)).toBe(false);
        expect(isMaharashtra('')).toBe(false);
    });
});

describe('RELATIONSHIP_OPTIONS (GST applicant role)', () => {
    it('offers exactly Proprietor, Partner and Witness with label === value', () => {
        expect(RELATIONSHIP_OPTIONS).toEqual([
            { label: 'Proprietor', value: 'Proprietor' },
            { label: 'Partner', value: 'Partner' },
            { label: 'Witness', value: 'Witness' },
        ]);
    });
});

describe('RULE_14A_OPTIONS', () => {
    it('offers exactly Yes and No', () => {
        expect(RULE_14A_OPTIONS.map(o => o.value)).toEqual(['Yes', 'No']);
    });
});
