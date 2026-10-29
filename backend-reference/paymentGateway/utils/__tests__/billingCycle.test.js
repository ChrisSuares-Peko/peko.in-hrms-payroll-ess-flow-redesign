const { journalBillingType } = require('../billingCycle');

describe('the billing cycle a journal is booked on', () => {
    it('reads an annual cycle however it was spelt', () => {
        expect(journalBillingType('ANNUALLY')).toBe('ANNUALLY');
        expect(journalBillingType('annually')).toBe('ANNUALLY');
        expect(journalBillingType(' Annually ')).toBe('ANNUALLY');
    });

    it('treats anything else as monthly, the cycle the journal defaults to', () => {
        expect(journalBillingType('MONTHLY')).toBe('MONTHLY');
        expect(journalBillingType('monthly')).toBe('MONTHLY');
        expect(journalBillingType('yearly')).toBe('MONTHLY');
        expect(journalBillingType(undefined)).toBe('MONTHLY');
        expect(journalBillingType(null)).toBe('MONTHLY');
    });
});

describe('the line a Peko Commerce invoice carries', () => {
    const { billingCycleLabel, ecommerceStoreInvoiceDescription } = require('../billingCycle');

    it('names the cycle the way a Peko subscription invoice does', () => {
        expect(billingCycleLabel('annually')).toBe('Annually');
        expect(billingCycleLabel('ANNUALLY')).toBe('Annually');
        expect(billingCycleLabel('Monthly')).toBe('Monthly');
        expect(billingCycleLabel(undefined)).toBe('Monthly');
    });

    it('describes the plan as Peko Commerce on its cycle', () => {
        expect(ecommerceStoreInvoiceDescription('Growth', 'annually')).toBe('Peko Commerce - Growth (Annually)');
        expect(ecommerceStoreInvoiceDescription('Starter', 'MONTHLY')).toBe('Peko Commerce - Starter (Monthly)');
        expect(ecommerceStoreInvoiceDescription(undefined, 'MONTHLY')).toBe('Peko Commerce (Monthly)');
    });
});
