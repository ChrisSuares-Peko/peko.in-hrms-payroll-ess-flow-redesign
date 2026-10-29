jest.mock('../../utils/checkAndFetchServiceDetails', () => ({
    fetchServiceDetails: jest.fn(),
    calculateSurcharge: jest.fn(),
    calculateAmountWithTax: jest.fn(),
    findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock('../../models/use-cases/setting', () => ({ getGstDetails: jest.fn() }));
jest.mock('../../utils/cacheDataMethods', () => ({ getValue: jest.fn() }));
// Not exercised here; its controller chain does not parse under Jest.
jest.mock('../../services/validateWhatsappForBusiness', () => jest.fn());
jest.mock('../../utils/subscriptionPricing', () => ({ calculateSubscriptionPrice: jest.fn() }));
jest.mock('../../models/use-cases/packages', () => ({ findOnePackage: jest.fn() }));
jest.mock('../../utils/calculateDiscount', () => ({
    calculateDiscountResponse: jest.fn(),
    calculateDiscount: jest.fn(),
}));

const { fetchServiceDetails, calculateSurcharge } = require('../../utils/checkAndFetchServiceDetails');
const { getGstDetails } = require('../../models/use-cases/setting');
const validateAmount = require('../validateAmount');

const res = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
};

const request = (body) => ({
    user: { id: 11, packageId: 5, corporateId: 42 },
    body: { accessKey: 'corporate_cards', quantity: 1, ...body },
    LogTraceId: 't',
});

const run = async (body) => {
    const next = jest.fn();
    const response = res();
    await validateAmount(request(body), response, next);
    return { next, response };
};

const refused = ({ next, response }) => {
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
};

beforeEach(() => {
    jest.clearAllMocks();
    fetchServiceDetails.mockResolvedValue({ id: 9, unitPrice: '100.00', surcharge: '2', surchargeType: 'PERCENTAGE' });
    getGstDetails.mockResolvedValue({ details: { gst: '18', type: 'PERCENTAGE' } });
});

describe('validateAmount — physical card purchase', () => {
    it('lets an order through when amount is the base and pgAmount is base + GST', async () => {
        const result = await run({ amount: 100, pgAmount: 118 });

        expect(result.next).toHaveBeenCalledTimes(1);
        expect(result.response.status).not.toHaveBeenCalled();
        expect(fetchServiceDetails).toHaveBeenCalledWith({
            credentialId: 11,
            accessKey: 'corporate_cards',
            packageId: 5,
            corporateUserId: 42,
        });
    });

    it('never adds the platform surcharge on top', async () => {
        await run({ amount: 100, pgAmount: 118 });

        expect(calculateSurcharge).not.toHaveBeenCalled();
    });

    it('rounds GST to the paisa like a plan purchase', async () => {
        fetchServiceDetails.mockResolvedValue({ unitPrice: '16.10' });

        const result = await run({ amount: 16.1, pgAmount: 19 });

        expect(result.next).toHaveBeenCalledTimes(1);
    });

    it('prices several cards on the line total', async () => {
        const result = await run({ amount: 300, pgAmount: 354, quantity: 3 });

        expect(result.next).toHaveBeenCalledTimes(1);
    });

    it('refuses the old GST-inclusive total before any money moves', async () => {
        refused(await run({ amount: 100, pgAmount: 100 }));
    });

    it('refuses the old base + surcharge total', async () => {
        refused(await run({ amount: 100, pgAmount: 102 }));
    });

    it('refuses a tampered base even when the total matches', async () => {
        refused(await run({ amount: 1, pgAmount: 118 }));
    });

    it('refuses when a coupon has lowered the total', async () => {
        refused(await run({ amount: 100, pgAmount: 100.3, couponCode: 'SAVE10' }));
    });

    it('refuses when the plan has no physical card price', async () => {
        fetchServiceDetails.mockResolvedValue({ unitPrice: '0' });

        refused(await run({ amount: 100, pgAmount: 118 }));
    });

    it('refuses when the service is not on the plan', async () => {
        fetchServiceDetails.mockResolvedValue({ error: 'Unable to process your request' });

        refused(await run({ amount: 100, pgAmount: 118 }));
    });
});
