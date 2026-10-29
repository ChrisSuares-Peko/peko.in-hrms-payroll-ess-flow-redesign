import { describe, it, expect } from 'vitest';

import {
    LLP_DESIGNATION,
    PROMOTER_ROLE,
    isDesignatedPartnerRole,
    isDinLimitedRole,
    isDirectorOnly,
    isDirectorRole,
    isRepresentativeRole,
    isShareholderRole,
    numberRangeOptions,
} from '../../utils/proprietorKyc';

describe('numberRangeOptions', () => {
    it('builds an inclusive numeric range', () => {
        expect(numberRangeOptions(2, 4)).toEqual([
            { label: '2', value: 2 },
            { label: '3', value: 3 },
            { label: '4', value: 4 },
        ]);
    });

    it('returns a single option when from === to', () => {
        expect(numberRangeOptions(5, 5)).toEqual([{ label: '5', value: 5 }]);
    });
});

describe('promoter role predicates (Private Limited)', () => {
    it('isDirectorRole — director variants only', () => {
        expect(isDirectorRole(PROMOTER_ROLE.DIRECTOR)).toBe(true);
        expect(isDirectorRole(PROMOTER_ROLE.DIRECTOR_SHAREHOLDER)).toBe(true);
        expect(isDirectorRole(PROMOTER_ROLE.DIRECTOR_REPRESENTATIVE)).toBe(true);
        expect(isDirectorRole(PROMOTER_ROLE.SHAREHOLDER)).toBe(false);
        expect(isDirectorRole('')).toBe(false);
    });

    it('isShareholderRole — everyone except a pure Director', () => {
        expect(isShareholderRole(PROMOTER_ROLE.DIRECTOR)).toBe(false);
        expect(isShareholderRole(PROMOTER_ROLE.DIRECTOR_SHAREHOLDER)).toBe(true);
        expect(isShareholderRole(PROMOTER_ROLE.SHAREHOLDER)).toBe(true);
        expect(isShareholderRole(PROMOTER_ROLE.REPRESENTATIVE)).toBe(true);
    });

    it('isRepresentativeRole — representative variants only', () => {
        expect(isRepresentativeRole(PROMOTER_ROLE.DIRECTOR_REPRESENTATIVE)).toBe(true);
        expect(isRepresentativeRole(PROMOTER_ROLE.REPRESENTATIVE)).toBe(true);
        expect(isRepresentativeRole(PROMOTER_ROLE.DIRECTOR)).toBe(false);
    });

    it('isDinLimitedRole — Director and Director-and-Shareholder only', () => {
        expect(isDinLimitedRole(PROMOTER_ROLE.DIRECTOR)).toBe(true);
        expect(isDinLimitedRole(PROMOTER_ROLE.DIRECTOR_SHAREHOLDER)).toBe(true);
        expect(isDinLimitedRole(PROMOTER_ROLE.DIRECTOR_REPRESENTATIVE)).toBe(false);
    });

    it('isDirectorOnly — strictly a plain Director (empty role stays included elsewhere)', () => {
        expect(isDirectorOnly(PROMOTER_ROLE.DIRECTOR)).toBe(true);
        expect(isDirectorOnly(PROMOTER_ROLE.DIRECTOR_SHAREHOLDER)).toBe(false);
        expect(isDirectorOnly('')).toBe(false);
    });
});

describe('isDesignatedPartnerRole (LLP)', () => {
    it('is true only for the designated-partner variants (which carry a DIN/DPIN)', () => {
        expect(isDesignatedPartnerRole(LLP_DESIGNATION.DESIGNATED_PARTNER)).toBe(true);
        expect(isDesignatedPartnerRole(LLP_DESIGNATION.DESIGNATED_PARTNER_REPRESENTATIVE)).toBe(
            true
        );
        expect(isDesignatedPartnerRole(LLP_DESIGNATION.PARTNER)).toBe(false);
        expect(isDesignatedPartnerRole(LLP_DESIGNATION.PARTNER_REPRESENTATIVE)).toBe(false);
        expect(isDesignatedPartnerRole(undefined)).toBe(false);
    });
});
