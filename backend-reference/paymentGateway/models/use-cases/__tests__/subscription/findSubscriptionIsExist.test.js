const { findSubscriptionIsExist } = require('../../../use-cases/subscription');
const Subscription = require('../../../entities/subscription');
jest.mock('../../../entities/subscription', () => ({
    findOne: jest.fn(),
}));

describe('findSubscriptionIsExist', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the subscription when it exists', async () => {
        const mockParams = { corporateId: 1, packageIds: 2 };
        const mockSubscription = {
            corporateUserId: 1,
            packageId: 2,
            isCustom: false,
            status: 'ACTIVE',
        };

        Subscription.findOne.mockResolvedValue(mockSubscription);

        const result = await findSubscriptionIsExist(mockParams);

        expect(Subscription.findOne).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateId,
                packageId: mockParams.packageIds,
                isCustom: false,
                status: "ACTIVE",
            },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockSubscription);
    });

    it('should return null when the subscription does not exist', async () => {
        const mockParams = { corporateId: 1, packageIds: 2 };

        Subscription.findOne.mockResolvedValue(null);

        const result = await findSubscriptionIsExist(mockParams);

        expect(Subscription.findOne).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateId,
                packageId: mockParams.packageIds,
                isCustom: false,
                status: "ACTIVE",
            },
            raw: true,
            nest: true,
        });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations', async () => {
        const mockParams = { corporateId: 1, packageIds: 2 };
        const mockError = new Error('Database error');

        Subscription.findOne.mockRejectedValue(mockError);

        const result = await findSubscriptionIsExist(mockParams);

        expect(Subscription.findOne).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateId,
                packageId: mockParams.packageIds,
                isCustom: false,
                status: "ACTIVE",
            },
            raw: true,
            nest: true,
        });
        expect(result).toBe(false);
    });

   
});