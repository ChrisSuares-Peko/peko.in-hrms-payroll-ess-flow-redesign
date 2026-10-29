const { findAllActiveSubscriptions } = require('../../../use-cases/subscription');
const Subscription = require('../../../entities/subscription');

jest.mock('../../../entities/subscription', () => ({
    findAll: jest.fn(),
}));

describe('findAllActiveSubscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active subscriptions', async () => {
        const mockParams = { corporateUserId: 1 };
        const mockActiveSubscriptions = [
            { id: 1, corporateUserId: 1, status: 'ACTIVE' },
            { id: 2, corporateUserId: 1, status: 'ACTIVE' }
        ];

        Subscription.findAll.mockResolvedValue(mockActiveSubscriptions);

        const result = await findAllActiveSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateUserId: mockParams.corporateUserId, status: "ACTIVE" },
            raw: true,
            nest: true,
        }));

        expect(result).toEqual(mockActiveSubscriptions);
    });

    it('should return empty array when no active subscriptions are found', async () => {
        const mockParams = { corporateUserId: 1 };

        Subscription.findAll.mockResolvedValue([]);

        const result = await findAllActiveSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateUserId: mockParams.corporateUserId, status: "ACTIVE" },
            raw: true,
            nest: true,
        }));

        expect(result).toEqual([]);
    });

    it('should handle errors during database operations', async () => {
        const mockParams = { corporateUserId: 1 };
        const mockError = new Error('Database error');

        Subscription.findAll.mockRejectedValue(mockError);

        const result = await findAllActiveSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateUserId: mockParams.corporateUserId, status: "ACTIVE" },
            raw: true,
            nest: true,
        }));

        expect(result).toBe(false);
    });

    it('should handle undefined params', async () => {
        await expect(findAllActiveSubscriptions(undefined)).rejects.toThrow();
    });
});
