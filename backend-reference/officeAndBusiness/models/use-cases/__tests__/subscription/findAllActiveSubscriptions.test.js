const { findAllActiveSubscriptions } = require('../../../use-cases/subscription');
const Subscription = require('../../../entities/subscription');

jest.mock('../../../entities/subscription', () => ({
    findAll: jest.fn(),
}));

describe('findAllActiveSubscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active subscriptions for a given corporateUserId', async () => {
        const mockParams = { corporateUserId: 1 };
        const mockResponse = [
            { id: 1, corporateUserId: 1, status: 'ACTIVE', packageName: 'Gold Plan' },
            { id: 2, corporateUserId: 1, status: 'ACTIVE', packageName: 'Silver Plan' },
        ];

        Subscription.findAll.mockResolvedValue(mockResponse);

        const result = await findAllActiveSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateUserId,
                status: 'ACTIVE',
            },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty array when no active subscriptions are found', async () => {
        const mockParams = { corporateUserId: 999 };
        Subscription.findAll.mockResolvedValue([]);

        const result = await findAllActiveSubscriptions(mockParams);

        expect(result).toEqual([]);
    });

    it('should return false and log an error when findAll fails', async () => {
        const mockParams = { corporateUserId: 2 };
        const mockError = new Error('Database error');

        Subscription.findAll.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findAllActiveSubscriptions(mockParams);

        expect(console.error).toHaveBeenCalledWith("Error finding package details:", mockError);
        expect(result).toBe(false);
    });
});
