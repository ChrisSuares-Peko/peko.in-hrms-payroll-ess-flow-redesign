const { findServiceSubscription, cancelServiceSubscription } = require('../../serviceSubscription');
const ServiceSubscription = require('../../../entities/serviceSubscription');

jest.mock('../../../entities/serviceSubscription', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

describe('serviceSubscription use-cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('findServiceSubscription', () => {
        it('should find a service subscription by id and corporateId', async () => {
            const mockSubscription = { id: 1, corporateUserId: 100 };
            ServiceSubscription.findOne.mockResolvedValue(mockSubscription);

            const result = await findServiceSubscription({ subscriptionId: 1, corporateId: 100 });

            expect(ServiceSubscription.findOne).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    corporateUserId: 100,
                },
                raw: true,
                nest: true,
            });
            expect(result).toEqual(mockSubscription);
        });

        it('should return null when subscription not found', async () => {
            ServiceSubscription.findOne.mockResolvedValue(null);

            const result = await findServiceSubscription({ subscriptionId: 999, corporateId: 100 });

            expect(result).toBeNull();
        });

        it('should return false on error', async () => {
            ServiceSubscription.findOne.mockRejectedValue(new Error('DB error'));

            const result = await findServiceSubscription({ subscriptionId: 1, corporateId: 100 });

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('cancelServiceSubscription', () => {
        it('should cancel a service subscription successfully', async () => {
            ServiceSubscription.update.mockResolvedValue([1]);

            const result = await cancelServiceSubscription({ subscriptionId: 1 });

            expect(ServiceSubscription.update).toHaveBeenCalledWith(
                { isCancelled: true },
                { where: { id: 1 } }
            );
            expect(result).toEqual({
                success: true,
                message: 'Your subscription has been cancelled. You will still be able to use the service until the end of your current billing cycle.',
            });
        });

        it('should return false on error', async () => {
            ServiceSubscription.update.mockRejectedValue(new Error('DB error'));

            const result = await cancelServiceSubscription({ subscriptionId: 1 });

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalled();
        });
    });
});
