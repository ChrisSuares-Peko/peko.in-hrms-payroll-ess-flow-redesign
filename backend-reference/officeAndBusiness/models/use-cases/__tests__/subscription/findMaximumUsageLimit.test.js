const { findMaximumUsageLimit } = require('../../../use-cases/subscription');
const Cashback = require('../../../entities/cashback');
const Subscription = require('../../../entities/subscription');

jest.mock('../../../entities/cashback', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/subscription', () => ({
    findOne: jest.fn(),
}));

describe('findMaximumUsageLimit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the maximum usage limit when cashback and subscription exist', async () => {
        const mockParams = { corporateId: 1, accessKey: 'key123' };
        const mockCashback = {
            unitPrice: 10,
            baseLimit: 100,
            packageId: 5,
        };
        const mockSubscription = {
            maxLimit: 50,
        };

        Cashback.findOne.mockResolvedValue(mockCashback);
        Subscription.findOne.mockResolvedValue(mockSubscription);

        const result = await findMaximumUsageLimit(mockParams);

        expect(Cashback.findOne).toHaveBeenCalledWith(expect.objectContaining({
            include: expect.any(Array),
            attributes: ['unitPrice', 'baseLimit', 'packageId'],
            raw: true,
            nest: true,
        }));
        expect(Subscription.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                corporateUserId: mockParams.corporateId,
                packageId: mockCashback.packageId,
                isCustom: true,
                status: 'ACTIVE',
            }),
            attributes: ['maxLimit'],
            raw: true,
            nest: true,
        }));
        expect(result).toEqual(150);
    });

    it('should return the base limit when no subscription exists', async () => {
        const mockParams = { corporateId: 2, accessKey: 'key456' };
        const mockCashback = {
            unitPrice: 20,
            baseLimit: 200,
            packageId: 10,
        };

        Cashback.findOne.mockResolvedValue(mockCashback);
        Subscription.findOne.mockResolvedValue(null);

        const result = await findMaximumUsageLimit(mockParams);

        expect(result).toEqual(200);
    });

    it('should return false when no cashback entry is found', async () => {
        const mockParams = { corporateId: 3, accessKey: 'key789' };
        Cashback.findOne.mockResolvedValue(null);

        const result = await findMaximumUsageLimit(mockParams);

        expect(result).toBe(false);
    });

    it('should return false and log an error when an exception occurs', async () => {
        const mockParams = { corporateId: 4, accessKey: 'keyError' };
        const mockError = new Error('Database error');

        Cashback.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findMaximumUsageLimit(mockParams);

        expect(console.error).toHaveBeenCalledWith('Error finding package details:', mockError);
        expect(result).toBe(false);
    });
});
