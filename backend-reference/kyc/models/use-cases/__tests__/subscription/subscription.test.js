const subscriptionUseCase = require('../../subscription');
const Subscription = require('../../../entities/subscription');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findAllActiveSubscriptions', () => {
    it('should find all active subscriptions for a corporate user', async () => {
        const mockResult = [
            { id: 1, corporateUserId: 1, status: 'ACTIVE' },
            { id: 2, corporateUserId: 1, status: 'ACTIVE' }
        ];
        Subscription.findAll.mockResolvedValue(mockResult);

        const result = await subscriptionUseCase.findAllActiveSubscriptions({ corporateUserId: 1 });
        expect(result).toEqual(mockResult);
        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: { corporateUserId: 1, status: 'ACTIVE' },
            raw: true,
            nest: true
        });
    });

    it('should return empty array when no active subscriptions', async () => {
        Subscription.findAll.mockResolvedValue([]);

        const result = await subscriptionUseCase.findAllActiveSubscriptions({ corporateUserId: 1 });
        expect(result).toEqual([]);
    });

    it('should return false on error', async () => {
        Subscription.findAll.mockRejectedValue(new Error('DB Error'));

        const result = await subscriptionUseCase.findAllActiveSubscriptions({ corporateUserId: 1 });
        expect(result).toBe(false);
    });
});
