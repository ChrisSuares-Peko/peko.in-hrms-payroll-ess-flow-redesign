const { findUserSubscriptionsByService } = require('../../subscription');
const Subscription = require('../../../entities/subscription');

jest.mock('../../../entities/subscription');

describe('findUserSubscriptionsByService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return individual active subscription when found', async () => {
        const mockSub = {
            subscriptionStartDate: '2024-01-01',
            subscriptionEndDate: '2024-12-31',
            billingType: 'MONTHLY',
            package: { packageName: 'eSign', accessCode: 'e_sign' },
        };
        Subscription.findOne.mockResolvedValueOnce(mockSub);

        const result = await findUserSubscriptionsByService({
            corporateId: 1,
            accessCode: 'e_sign',
        });

        expect(Subscription.findOne).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockSub);
    });

    it('should return GROUP subscription when individual not found', async () => {
        const mockGroupSub = {
            subscriptionStartDate: '2024-01-01',
            subscriptionEndDate: '2024-12-31',
            subscriptionAmountPaid: 500,
            billingType: 'MONTHLY',
            package: { id: 1, packageName: 'Peko+' },
        };
        Subscription.findOne
            .mockResolvedValueOnce(null)   // individual not found
            .mockResolvedValueOnce(mockGroupSub); // group found

        const result = await findUserSubscriptionsByService({
            corporateId: 1,
            accessCode: 'e_sign',
        });

        expect(Subscription.findOne).toHaveBeenCalledTimes(2);
        expect(result).toEqual(mockGroupSub);
    });

    it('should return false when no subscription found and checkIsExpired is false', async () => {
        Subscription.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);

        const result = await findUserSubscriptionsByService({
            corporateId: 1,
            accessCode: 'e_sign',
            checkIsExpired: false,
        });

        expect(result).toBe(false);
    });

    it('should check expired subscriptions when checkIsExpired is true', async () => {
        const mockExpiredSub = {
            subscriptionStartDate: '2023-01-01',
            subscriptionEndDate: '2023-12-31',
            billingType: 'MONTHLY',
        };
        Subscription.findOne
            .mockResolvedValueOnce(null)   // individual active not found
            .mockResolvedValueOnce(null)   // group active not found
            .mockResolvedValueOnce(mockExpiredSub); // individual expired found

        const result = await findUserSubscriptionsByService({
            corporateId: 1,
            accessCode: 'e_sign',
            checkIsExpired: true,
        });

        expect(Subscription.findOne).toHaveBeenCalledTimes(3);
        expect(result).toEqual(mockExpiredSub);
    });

    it('should return false on error', async () => {
        Subscription.findOne.mockRejectedValue(new Error('DB error'));

        const result = await findUserSubscriptionsByService({
            corporateId: 1,
            accessCode: 'e_sign',
        });

        expect(result).toBe(false);
    });
});
