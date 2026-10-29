import { describe, expect, it } from 'vitest';

import { addonRowKey, SubscriptionAddOnRow } from '../api/subscriptionAddOns';

const row = (overrides: Partial<SubscriptionAddOnRow>): SubscriptionAddOnRow => ({
    packageId: 2,
    cashbackId: null,
    packageName: 'Peko +',
    serviceProvider: 'Travel eSIM Bonido',
    accessKey: 'bondio_esim',
    serviceOperatorId: 81,
    partnerId: '638',
    partnerName: 'Test partner',
    unitPrice: '0.00',
    baseLimit: '0.00',
    cashbackType: 'PERCENTAGE',
    cashback: '0',
    surchargeType: 'FLAT',
    surcharge: '2.00',
    ...overrides,
});

describe('addonRowKey', () => {
    it('stays unique even when the same package/service pair has two cashback rows', () => {
        const first = row({ cashbackId: 142 });
        const second = row({ cashbackId: 243 });

        expect(addonRowKey(first)).not.toBe(addonRowKey(second));
    });

    it('falls back to the package/service pair only when there is no cashbackId yet', () => {
        expect(addonRowKey(row({ cashbackId: null }))).toBe('pkg-2-81');
    });
});
