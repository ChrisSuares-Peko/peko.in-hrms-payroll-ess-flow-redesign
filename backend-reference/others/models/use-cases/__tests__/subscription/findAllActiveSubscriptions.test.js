const { findAllActiveSubscriptions } = require('../../subscription');
const Subscription = require('../../../entities/subscription');

jest.mock('../../../entities/subscription', () => ({
    findAll: jest.fn(),
}));

describe('findAllActiveSubscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active subscriptions for the given corporateUserId', async () => {
        const mockParams = { corporateUserId: 1 };
        const mockSubscriptions = [
            {
                id: 1,
                corporateUserId: 1,
                status: 'ACTIVE',
                packageName: 'Basic Package',
                startDate: '2023-01-01',
                endDate: '2023-12-31',
            },
            {
                id: 2,
                corporateUserId: 1,
                status: 'ACTIVE',
                packageName: 'Premium Package',
                startDate: '2023-02-01',
                endDate: '2023-12-31',
            },
        ];

        Subscription.findAll.mockResolvedValue(mockSubscriptions);

        const result = await findAllActiveSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateUserId,
                status: 'ACTIVE',
            },
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockSubscriptions);
    });

    it('should return an empty array if no active subscriptions are found', async () => {
        const mockParams = { corporateUserId: 2 };

        Subscription.findAll.mockResolvedValue([]);

        const result = await findAllActiveSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateUserId,
                status: 'ACTIVE',
            },
            raw: true,
            nest: true,
        });

        expect(result).toEqual([]);
    });

    it('should return false if an error occurs', async () => {
        const mockParams = { corporateUserId: 3 };
        const mockError = new Error('Database error');

        Subscription.findAll.mockRejectedValue(mockError);

        const result = await findAllActiveSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateUserId,
                status: 'ACTIVE',
            },
            raw: true,
            nest: true,
        });

        expect(result).toBe(false);
    });
});
