const { checkUserSubscriptionPriority } = require('../../subscription');
const Subscription = require('../../../entities/subscription');
const Package = require('../../../entities/package');
const { Op } = require('sequelize');

jest.mock('../../../entities/subscription', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/package', () => ({
    max: jest.fn(),
}));

describe('checkUserSubscriptionPriority', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return true if the user has the top priority subscription', async () => {
        const mockCorporateUserId = 1;
        const mockPartnerId = 10;

        const mockActiveGroupSubscription = {
            id: 1,
            package: {
                id: 101,
                packageName: 'Premium Group Package',
                priorityLevel: 5,
            },
        };

        const mockTopPlanPriority = 5;

        Subscription.findOne.mockResolvedValue(mockActiveGroupSubscription);
        Package.max.mockResolvedValue(mockTopPlanPriority);

        const result = await checkUserSubscriptionPriority(mockCorporateUserId, mockPartnerId);

        expect(Subscription.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: Package,
                    attributes: ['id', 'packageName', 'priorityLevel'],
                    where: {
                        packageType: 'GROUP',
                    },
                },
            ],
            where: {
                status: 'ACTIVE',
                corporateUserId: mockCorporateUserId,
                subscriptionPaymentRefId: {
                    [Op.ne]: null,
                },
            },
            attributes: ['id'],
            raw: true,
            nest: true,
        });

        expect(Package.max).toHaveBeenCalledWith('priorityLevel', {
            where: { status: true, packageType: 'GROUP', partnerId: mockPartnerId },
        });

        expect(result).toBe(true);
    });

    it('should return false if the user does not have the top priority subscription', async () => {
        const mockCorporateUserId = 1;
        const mockPartnerId = 10;

        const mockActiveGroupSubscription = {
            id: 1,
            package: {
                id: 101,
                packageName: 'Standard Group Package',
                priorityLevel: 3,
            },
        };

        const mockTopPlanPriority = 5;

        Subscription.findOne.mockResolvedValue(mockActiveGroupSubscription);
        Package.max.mockResolvedValue(mockTopPlanPriority);

        const result = await checkUserSubscriptionPriority(mockCorporateUserId, mockPartnerId);

        expect(result).toBe(false);
    });

    it('should return false if no active group subscription is found', async () => {
        const mockCorporateUserId = 1;
        const mockPartnerId = 10;

        Subscription.findOne.mockResolvedValue(null);

        const result = await checkUserSubscriptionPriority(mockCorporateUserId, mockPartnerId);

        expect(Subscription.findOne).toHaveBeenCalled();
        expect(Package.max).not.toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should return false if an error occurs', async () => {
        const mockCorporateUserId = 1;
        const mockPartnerId = 10;

        Subscription.findOne.mockRejectedValue(new Error('Database error'));

        const result = await checkUserSubscriptionPriority(mockCorporateUserId, mockPartnerId);

        expect(result).toBe(false);
    });
});
