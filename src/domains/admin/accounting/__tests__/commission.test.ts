import { describe, expect, it } from 'vitest';

import {
    formatCommissionLabel,
    formatInr,
    serviceActivityPill,
    serviceConfigurationStatus,
    toAmountField,
} from '../utils/commission';

describe('formatInr', () => {
    it('dashes a figure the journal never derived rather than printing a zero', () => {
        expect(formatInr(null)).toBe('—');
        expect(formatInr(undefined)).toBe('—');
        expect(formatInr(0)).toBe('₹ 0.00');
        expect(formatInr(1234.5)).toBe('₹ 1,234.50');
    });
});

describe('formatCommissionLabel', () => {
    it('returns null only when no commission type was ever set', () => {
        expect(
            formatCommissionLabel({
                commissionType: null,
                providerCommission: 5,
                fixedCommissionPerTransaction: 0,
            })
        ).toBeNull();
    });

    it('shows a zero as a configured rate in the type’s own format', () => {
        expect(
            formatCommissionLabel({
                commissionType: 'PERCENTAGE',
                providerCommission: 0,
                fixedCommissionPerTransaction: 0,
            })
        ).toBe('0%');
        expect(
            formatCommissionLabel({
                commissionType: 'FLAT',
                providerCommission: 0,
                fixedCommissionPerTransaction: 0,
            })
        ).toBe('₹ 0.00');
    });

    it('lets a fixed amount stand alone when the rate is zero', () => {
        expect(
            formatCommissionLabel({
                commissionType: 'PERCENTAGE',
                providerCommission: 0,
                fixedCommissionPerTransaction: 5,
            })
        ).toBe('₹ 5.00');
    });

    it('formats a percentage rate', () => {
        expect(
            formatCommissionLabel({
                commissionType: 'PERCENTAGE',
                providerCommission: 2.5,
                fixedCommissionPerTransaction: 0,
            })
        ).toBe('2.5%');
    });

    it('formats a flat rate in rupees', () => {
        expect(
            formatCommissionLabel({
                commissionType: 'FLAT',
                providerCommission: 5,
                fixedCommissionPerTransaction: 0,
            })
        ).toBe('₹ 5.00');
    });

    it('combines a percentage with a fixed amount per transaction', () => {
        expect(
            formatCommissionLabel({
                commissionType: 'PERCENTAGE',
                providerCommission: 2.5,
                fixedCommissionPerTransaction: 5,
            })
        ).toBe('2.5% + ₹ 5.00');
    });
});

describe('toAmountField', () => {
    it('prefills a stored zero as 0 and leaves only a missing value blank', () => {
        expect(toAmountField(0)).toBe('0');
        expect(toAmountField('0.0000')).toBe('0');
        expect(toAmountField('2.5000')).toBe('2.5');
        expect(toAmountField(12)).toBe('12');
        expect(toAmountField(null)).toBe('');
        expect(toAmountField(undefined)).toBe('');
        expect(toAmountField('')).toBe('');
        expect(toAmountField('abc')).toBe('');
    });
});

describe('serviceActivityPill', () => {
    it('only says whether the service is switched on', () => {
        expect(serviceActivityPill({ serviceStatus: true })).toEqual({
            label: 'Active',
            tone: 'success',
        });
        expect(serviceActivityPill({ serviceStatus: false })).toEqual({
            label: 'Inactive',
            tone: 'neutral',
        });
    });
});

describe('serviceConfigurationStatus', () => {
    const counts = (total: number, notConfigured: number) => ({ total, notConfigured });
    const status = (overrides: Partial<Parameters<typeof serviceConfigurationStatus>[0]>) =>
        serviceConfigurationStatus({
            serviceStatus: true,
            planType: 'without_plans',
            commissionConfigured: true,
            configuration: { plans: null, serviceCommissionItems: null, platformFee: counts(3, 0) },
            ...overrides,
        });

    it('marks an inactive service inactive whatever is configured', () => {
        expect(status({ serviceStatus: false, commissionConfigured: false })).toEqual({
            label: 'Inactive',
            tone: 'neutral',
            notes: [],
        });
    });

    it('reads configured only when the commission and every package fee are marked', () => {
        expect(status({})).toEqual({ label: 'Configured', tone: 'success', notes: [] });
    });

    it('names the commission of a service without plans and counts the package fees left', () => {
        expect(
            status({
                commissionConfigured: false,
                configuration: {
                    plans: null,
                    serviceCommissionItems: null,
                    platformFee: counts(3, 1),
                },
            })
        ).toEqual({
            label: 'Not configured',
            tone: 'warning',
            notes: ['Commission not configured', 'Platform fee: 1 of 3 packages not configured'],
        });
    });

    it('counts the plans left on a service with plans, ignoring its own commission', () => {
        expect(
            status({
                planType: 'with_plans',
                commissionConfigured: false,
                configuration: {
                    plans: counts(12, 3),
                    serviceCommissionItems: null,
                    platformFee: counts(1, 0),
                },
            }).notes
        ).toEqual(['Commission: 3 of 12 plans not configured']);
        expect(
            status({
                planType: 'with_plans',
                configuration: {
                    plans: counts(1, 1),
                    serviceCommissionItems: null,
                    platformFee: counts(1, 1),
                },
            }).notes
        ).toEqual([
            'Commission: 1 of 1 plan not configured',
            'Platform fee: 1 of 1 package not configured',
        ]);
    });

    it('counts the add-ons whose commission is not confirmed next to the plans', () => {
        expect(
            status({
                planType: 'with_plans',
                configuration: {
                    plans: counts(4, 0),
                    addOns: counts(2, 1),
                    serviceCommissionItems: null,
                    platformFee: counts(1, 0),
                },
            }).notes
        ).toEqual(['Commission: 1 of 2 add-ons not configured']);
        expect(
            status({
                planType: 'with_plans',
                configuration: {
                    plans: counts(4, 0),
                    addOns: counts(2, 0),
                    serviceCommissionItems: null,
                    platformFee: counts(1, 0),
                },
            }).notes
        ).toEqual([]);
    });

    it('also needs the service commission when it sells something outside its plans', () => {
        expect(
            status({
                planType: 'with_plans',
                commissionConfigured: false,
                configuration: {
                    plans: counts(6, 0),
                    serviceCommissionItems: 'domain registrations',
                    platformFee: counts(2, 0),
                },
            }).notes
        ).toEqual(['Commission for domain registrations not configured']);
    });

    it('falls back to the service commission for a service with plans that has no plan list', () => {
        expect(
            status({
                planType: 'with_plans',
                commissionConfigured: false,
                configuration: {
                    plans: null,
                    serviceCommissionItems: null,
                    platformFee: counts(0, 0),
                },
            }).notes
        ).toEqual(['Commission not configured']);
    });

    it('still reads the commission flag when the summary has not arrived', () => {
        expect(status({ configuration: undefined }).label).toBe('Configured');
        expect(status({ configuration: null, commissionConfigured: false }).notes).toEqual([
            'Commission not configured',
        ]);
    });
});
