jest.mock('../../services/GSTandTAXcalculation', () => ({ calculateTaxBreakdown: jest.fn() }));

const { calculateTaxBreakdown } = require('../../services/GSTandTAXcalculation');
const { calculatePhysicalCardPrice, NOT_PURCHASABLE_MESSAGE } = require('../physicalCardPricing');

const gst18 = (net) => {
    const taxAmount = Math.round(net * 18) / 100;
    return { taxableAmount: net, taxAmount, grossAmount: net + taxAmount, taxRate: 18 };
};

beforeEach(() => {
    jest.clearAllMocks();
    calculateTaxBreakdown.mockImplementation(async (net) => gst18(net));
});

describe('pricing an extra physical card', () => {
    it('treats unitPrice as the pre-GST base and adds GST on top', async () => {
        const pricing = await calculatePhysicalCardPrice({ serviceDetails: { unitPrice: '100' }, quantity: 1 });

        expect(calculateTaxBreakdown).toHaveBeenCalledWith(100);
        expect(pricing).toEqual({
            unitPrice: 100,
            quantity: 1,
            taxableAmount: 100,
            taxAmount: 18,
            taxRate: 18,
            expectedPaymentAmount: 118,
        });
    });

    it('taxes the line total for several cards', async () => {
        const pricing = await calculatePhysicalCardPrice({ serviceDetails: { unitPrice: 50 }, quantity: 3 });

        expect(calculateTaxBreakdown).toHaveBeenCalledWith(150);
        expect(pricing.quantity).toBe(3);
        expect(pricing.expectedPaymentAmount).toBe(177);
    });

    it.each([undefined, 0, -1, 'abc', 1.5])('falls back to one card for quantity %p', async (quantity) => {
        const pricing = await calculatePhysicalCardPrice({ serviceDetails: { unitPrice: 100 }, quantity });

        expect(pricing.quantity).toBe(1);
        expect(calculateTaxBreakdown).toHaveBeenCalledWith(100);
    });

    it('passes through a zero-tax breakdown when no GST is configured', async () => {
        calculateTaxBreakdown.mockResolvedValue({ taxableAmount: 100, taxAmount: 0, grossAmount: 100, taxRate: 0 });

        const pricing = await calculatePhysicalCardPrice({ serviceDetails: { unitPrice: 100 } });

        expect(pricing.taxAmount).toBe(0);
        expect(pricing.expectedPaymentAmount).toBe(100);
    });

    it.each([undefined, null, '', 0, -5, 'abc'])('refuses when the plan has no price (%p)', async (unitPrice) => {
        const pricing = await calculatePhysicalCardPrice({ serviceDetails: { unitPrice } });

        expect(pricing).toEqual({ error: NOT_PURCHASABLE_MESSAGE });
        expect(calculateTaxBreakdown).not.toHaveBeenCalled();
    });
});
