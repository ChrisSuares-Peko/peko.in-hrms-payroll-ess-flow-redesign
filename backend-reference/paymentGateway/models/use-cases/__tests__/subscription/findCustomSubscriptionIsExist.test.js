const { findCustomSubscriptionIsExist } = require('../../../use-cases/subscription'); 
const Subscription = require('../../../entities/subscription'); 
jest.mock('../../../entities/subscription', () => ({
    findOne: jest.fn(),
}));

describe('findCustomSubscriptionIsExist', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the custom subscription when it exists', async () => {
        const mockParams = { corporateId: 1, packageId: 2 };
        const mockSubscription = {
            corporateUserId: 1,
            packageId: 2,
            isCustom: true,
            status: 'ACTIVE',
        };

        Subscription.findOne.mockResolvedValue(mockSubscription);

        const result = await findCustomSubscriptionIsExist(mockParams);

        expect(Subscription.findOne).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateId,
                packageId: mockParams.packageId,
                isCustom: true,
                status: "ACTIVE",
            },
            nest: true,
        });
        expect(result).toEqual(mockSubscription);
    });

    it('should return null when the custom subscription does not exist', async () => {
        const mockParams = { corporateId: 1, packageId: 2 };

        Subscription.findOne.mockResolvedValue(null);

        const result = await findCustomSubscriptionIsExist(mockParams);

        expect(Subscription.findOne).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateId,
                packageId: mockParams.packageId,
                isCustom: true,
                status: "ACTIVE",
            },
            nest: true,
        });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations', async () => {
        const mockParams = { corporateId: 1, packageId: 2 };
        const mockError = new Error('Database error');

        Subscription.findOne.mockRejectedValue(mockError);

        const result = await findCustomSubscriptionIsExist(mockParams);

        expect(Subscription.findOne).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateId,
                packageId: mockParams.packageId,
                isCustom: true,
                status: "ACTIVE",
            },
            nest: true,
        });
        expect(result).toBe(false);
    });

 
});