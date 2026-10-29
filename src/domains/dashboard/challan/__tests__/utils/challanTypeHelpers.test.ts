import { describe, it, expect } from 'vitest';

import { Challan, isChallanPayable, isCourtMatter } from '../../types/index';

const makeChallan = (over: Partial<Challan> = {}): Challan => ({
    challan_number: 'CH1',
    registration_number: 'KA01AB1234',
    offense_details: 'Over speeding',
    challan_place: 'MG Road',
    state: 'KA',
    amount: 100,
    challan_date: '2026-01-01',
    challan_status: 'Pending',
    ...over,
});

describe('isCourtMatter', () => {
    it('is true when court_challan is present and not "NA"', () => {
        expect(isCourtMatter(makeChallan({ court_challan: 'COURT123' }))).toBe(true);
    });

    it('is false when court_challan is "NA"', () => {
        expect(isCourtMatter(makeChallan({ court_challan: 'NA' }))).toBe(false);
    });

    it('is false when court_challan is missing', () => {
        expect(isCourtMatter(makeChallan())).toBe(false);
    });
});

describe('isChallanPayable', () => {
    it('is true for a Pending challan', () => {
        expect(isChallanPayable(makeChallan({ challan_status: 'Pending' }))).toBe(true);
    });

    it('is false for a Paid challan', () => {
        expect(isChallanPayable(makeChallan({ challan_status: 'Paid' }))).toBe(false);
    });

    it('is false for a Disposed challan', () => {
        expect(isChallanPayable(makeChallan({ challan_status: 'Disposed' }))).toBe(false);
    });
});
