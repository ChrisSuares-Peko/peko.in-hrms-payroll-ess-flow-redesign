const { findActiveSubscriptionsByPackage } = require('../../subscription');
const Subscription = require('../../../entities/subscription');

jest.mock('../../../entities/subscription');

describe('findActiveSubscriptionsByPackage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find all active subscriptions by packageId', async () => {
        const mockParams = { packageId: 10 };
        const mockResult = [
            { id: 1, packageId: 10, status: 'ACTIVE' },
            { id: 2, packageId: 10, status: 'ACTIVE' },
        ];
        Subscription.findAll.mockResolvedValue(mockResult);

        const result = await findActiveSubscriptionsByPackage(mockParams);
        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: { packageId: 10, status: 'ACTIVE' },
            attributes: null,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should pass custom attributes', async () => {
        const mockParams = { packageId: 10 };
        const attrs = ['id', 'packageId'];
        Subscription.findAll.mockResolvedValue([]);

        const result = await findActiveSubscriptionsByPackage(mockParams, attrs);
        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: { packageId: 10, status: 'ACTIVE' },
            attributes: attrs,
            raw: true,
            nest: true,
        });
        expect(result).toEqual([]);
    });

    it('should return false on error', async () => {
        Subscription.findAll.mockRejectedValue(new Error('DB error'));

        const result = await findActiveSubscriptionsByPackage({ packageId: 10 });
        expect(result).toBe(false);
    });
});
