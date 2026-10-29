'use strict';
const {
    resolveDomainHostingPrice,
    resolvePlanPricingDetails,
    getValidBillingCycles,
} = require('../resolveDomainHostingPrice');

const mockPricingData = {
    'linux-hosting': {
        'starter': {
            add: { '12': '600', '24': '1100', '36': '1500' },
            renew: { '12': '700', '24': '1200' },
        },
    },
    'domain-com': {
        addnewdomain: { '1': '899' },
    },
    'linux-vps': {
        plans: {
            'vps-plan-1': {
                add: { '1': '999', '3': '2800' },
                renew: { '1': '1100', '3': '3100' },
            },
        },
    },
    'titan-email': {
        plans: {
            'neo-starter': {
                add: { '12': '1200', '24': '2200' },
                renew: { '12': '1300' },
            },
        },
    },
    'google-workspace': {
        plans: {
            'business-starter': {
                add: { '12': '1500' },
                renew: { '12': '1600' },
            },
        },
    },
};

// ─── resolveDomainHostingPrice ────────────────────────────────────────────────

describe('resolveDomainHostingPrice', () => {
    it('should return null when product is not found in pricing data', () => {
        const result = resolveDomainHostingPrice(mockPricingData, 'unknown-product', 'domain', null, null);
        expect(result).toBeNull();
    });

    it('should return domain price for planType domain', () => {
        const result = resolveDomainHostingPrice(mockPricingData, 'domain-com', 'domain', null, null);
        expect(result).toBe(899);
    });

    it('should return null when domain has no addnewdomain price', () => {
        const result = resolveDomainHostingPrice({ 'no-price': {} }, 'no-price', 'domain', null, null);
        expect(result).toBeNull();
    });

    it('should return specific cycle price for shared_hosting with billingCycle', () => {
        const result = resolveDomainHostingPrice(mockPricingData, 'linux-hosting', 'shared_hosting', 'starter', 24);
        expect(result).toBe(1100);
    });

    it('should return minimum cycle price for shared_hosting without billingCycle', () => {
        const result = resolveDomainHostingPrice(mockPricingData, 'linux-hosting', 'shared_hosting', 'starter', null);
        expect(result).toBe(600);
    });

    it('should return specific cycle price for vps_server with billingCycle', () => {
        const result = resolveDomainHostingPrice(mockPricingData, 'linux-vps', 'vps_server', 'vps-plan-1', 3);
        expect(result).toBe(2800);
    });

    it('should return minimum price for vps_server without billingCycle', () => {
        const result = resolveDomainHostingPrice(mockPricingData, 'linux-vps', 'vps_server', 'vps-plan-1', null);
        expect(result).toBe(999);
    });

    it('should return price for titan_email with billingCycle', () => {
        const result = resolveDomainHostingPrice(mockPricingData, 'titan-email', 'titan_email', 'neo-starter', 12);
        expect(result).toBe(1200);
    });

    it('should return shortest cycle price for google_workspace without billingCycle', () => {
        const result = resolveDomainHostingPrice(mockPricingData, 'google-workspace', 'google_workspace', 'business-starter', null);
        expect(result).toBe(1500);
    });

    it('should return shortest cycle price for titan_email without billingCycle even when a longer cycle is cheaper', () => {
        const data = {
            'titan-email': {
                plans: { 'neo-starter': { add: { '1': '45', '12': '35' }, renew: { '1': '75', '12': '65' } } },
            },
        };
        const result = resolveDomainHostingPrice(data, 'titan-email', 'titan_email', 'neo-starter', null);
        expect(result).toBe(45);
    });

    it('should return null for unknown planType', () => {
        const result = resolveDomainHostingPrice(mockPricingData, 'linux-hosting', 'unknown_type', 'starter', null);
        expect(result).toBeNull();
    });

    it('should return null when pricingData is null', () => {
        const result = resolveDomainHostingPrice(null, 'linux-hosting', 'shared_hosting', 'starter', null);
        expect(result).toBeNull();
    });
});

// ─── resolvePlanPricingDetails ────────────────────────────────────────────────

describe('resolvePlanPricingDetails', () => {
    it('should return null when product is not found', () => {
        const result = resolvePlanPricingDetails(mockPricingData, 'unknown', 'starter');
        expect(result).toBeNull();
    });

    it('should return pricing details for hosting plan via direct key', () => {
        const result = resolvePlanPricingDetails(mockPricingData, 'linux-hosting', 'starter');
        expect(result).toEqual({
            add: { '12': 600, '24': 1100, '36': 1500 },
            renew: { '12': 700, '24': 1200 },
        });
    });

    it('should return pricing details for vps_server via nested plans key', () => {
        const result = resolvePlanPricingDetails(mockPricingData, 'linux-vps', 'vps-plan-1');
        expect(result).toEqual({
            add: { '1': 999, '3': 2800 },
            renew: { '1': 1100, '3': 3100 },
        });
    });

    it('should return pricing details for titan_email via nested plans key', () => {
        const result = resolvePlanPricingDetails(mockPricingData, 'titan-email', 'neo-starter');
        expect(result).toEqual({
            add: { '12': 1200, '24': 2200 },
            renew: { '12': 1300 },
        });
    });

    it('should return null when plan ID is not found under the product', () => {
        const result = resolvePlanPricingDetails(mockPricingData, 'linux-hosting', 'nonexistent-plan');
        expect(result).toBeNull();
    });

    it('should return null when pricingData is null', () => {
        const result = resolvePlanPricingDetails(null, 'linux-hosting', 'starter');
        expect(result).toBeNull();
    });

    it('should return null when all prices are zero or invalid', () => {
        const data = { 'product': { 'plan': { add: { '12': '0' }, renew: { '12': 'NaN' } } } };
        const result = resolvePlanPricingDetails(data, 'product', 'plan');
        expect(result).toBeNull();
    });
});

// ─── getValidBillingCycles ────────────────────────────────────────────────────

describe('getValidBillingCycles', () => {
    it('should return null when product is not found', () => {
        const result = getValidBillingCycles(mockPricingData, 'unknown', 'shared_hosting', 'starter');
        expect(result).toBeNull();
    });

    it('should return billing cycles for shared_hosting plan', () => {
        const result = getValidBillingCycles(mockPricingData, 'linux-hosting', 'shared_hosting', 'starter');
        expect(result).toEqual(expect.arrayContaining([12, 24, 36]));
    });

    it('should return billing cycles for vps_server plan', () => {
        const result = getValidBillingCycles(mockPricingData, 'linux-vps', 'vps_server', 'vps-plan-1');
        expect(result).toEqual(expect.arrayContaining([1, 3]));
    });

    it('should return billing cycles for titan_email plan', () => {
        const result = getValidBillingCycles(mockPricingData, 'titan-email', 'titan_email', 'neo-starter');
        expect(result).toEqual(expect.arrayContaining([12, 24]));
    });

    it('should return billing cycles for google_workspace plan', () => {
        const result = getValidBillingCycles(mockPricingData, 'google-workspace', 'google_workspace', 'business-starter');
        expect(result).toEqual([12]);
    });

    it('should return null for unknown planType', () => {
        const result = getValidBillingCycles(mockPricingData, 'linux-hosting', 'unknown_type', 'starter');
        expect(result).toBeNull();
    });

    it('should return null when all cycle prices are zero', () => {
        const data = { 'p': { 'plan': { add: { '12': '0', '24': '0' } } } };
        const result = getValidBillingCycles(data, 'p', 'shared_hosting', 'plan');
        expect(result).toBeNull();
    });

    it('should return null when pricingData is null', () => {
        const result = getValidBillingCycles(null, 'linux-hosting', 'shared_hosting', 'starter');
        expect(result).toBeNull();
    });
});
