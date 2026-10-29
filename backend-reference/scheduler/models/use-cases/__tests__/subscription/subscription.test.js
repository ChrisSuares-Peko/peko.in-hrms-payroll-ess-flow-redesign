const {
    findAllActiveSubscriptions,
    fetchSubscriptionForAutoRenewal,
    fetchSubscriptionForAutoRenewalRetry
} = require('../../subscription');
const Subscription = require('../../../entities/subscription');
const sequelizeConfig = require('../../../../configs/database/index');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findAllActiveSubscriptions', () => {
    it('should find all active subscriptions for a corporate user', async () => {
        const mockResult = [{ id: 1, status: 'ACTIVE', corporateUserId: 5 }];
        Subscription.findAll.mockResolvedValue(mockResult);

        const result = await findAllActiveSubscriptions({ corporateUserId: 5 });
        expect(result).toEqual(mockResult);
        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: { corporateUserId: 5, status: 'ACTIVE' },
            raw: true,
            nest: true
        });
    });

    it('should return false on error', async () => {
        Subscription.findAll.mockRejectedValue(new Error('DB Error'));

        const result = await findAllActiveSubscriptions({ corporateUserId: 5 });
        expect(result).toBe(false);
    });
});

describe('fetchSubscriptionForAutoRenewal', () => {
    it('should return empty array when no active subscriptions found', async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        const result = await fetchSubscriptionForAutoRenewal();
        expect(result).toEqual([]);
    });

    it('should return processed subscriptions with addon details for GROUP packages', async () => {
        const mockSubs = [
            { id: 1, corporateUserId: 5, packageType: 'GROUP', isCustom: 0 },
            { id: 2, corporateUserId: 5, packageType: 'GROUP', isCustom: 1, packageId: 10 }
        ];
        sequelizeConfig.query.mockResolvedValue(mockSubs);

        const result = await fetchSubscriptionForAutoRenewal();
        expect(result).toHaveLength(1);
        expect(result[0].addonDetails).toHaveLength(1);
    });

    it('should return processed subscriptions with addon details for individual packages', async () => {
        const mockSubs = [
            { id: 1, corporateUserId: 5, packageType: 'INDIVIDUAL', packageId: 10, isCustom: 0 },
            { id: 2, corporateUserId: 5, packageType: 'INDIVIDUAL', packageId: 10, isCustom: 1 }
        ];
        sequelizeConfig.query.mockResolvedValue(mockSubs);

        const result = await fetchSubscriptionForAutoRenewal();
        expect(result).toHaveLength(1);
        expect(result[0].addonDetails).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
        sequelizeConfig.query.mockRejectedValue(new Error('DB Error'));

        const result = await fetchSubscriptionForAutoRenewal();
        expect(result).toEqual([]);
    });
});

describe('fetchSubscriptionForAutoRenewalRetry', () => {
    it('should return empty array when no grace period subscriptions found', async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        const result = await fetchSubscriptionForAutoRenewalRetry();
        expect(result).toEqual([]);
    });

    it('should return empty array when retry settings not found', async () => {
        sequelizeConfig.query
            .mockResolvedValueOnce([{ id: 1, packageType: 'INDIVIDUAL', isCustom: 0 }])
            .mockResolvedValueOnce([]);

        const result = await fetchSubscriptionForAutoRenewalRetry();
        expect(result).toEqual([]);
    });

    it('should return empty array when retrySubscription is disabled', async () => {
        sequelizeConfig.query
            .mockResolvedValueOnce([{ id: 1, packageType: 'INDIVIDUAL', isCustom: 0 }])
            .mockResolvedValueOnce([{ details: { retrySubscription: false } }]);

        const result = await fetchSubscriptionForAutoRenewalRetry();
        expect(result).toEqual([]);
    });

    it('should return processed subscriptions with maxRetries when enabled', async () => {
        const mockSubs = [
            { id: 1, corporateUserId: 5, packageType: 'INDIVIDUAL', packageId: 10, isCustom: 0 }
        ];
        sequelizeConfig.query
            .mockResolvedValueOnce(mockSubs)
            .mockResolvedValueOnce([{ details: { retrySubscription: true, maxRetries: 3 } }]);

        const result = await fetchSubscriptionForAutoRenewalRetry();
        expect(result).toHaveLength(1);
        expect(result[0].maxRetries).toBe(3);
    });

    it('should return empty array on error', async () => {
        sequelizeConfig.query.mockRejectedValue(new Error('DB Error'));

        const result = await fetchSubscriptionForAutoRenewalRetry();
        expect(result).toEqual([]);
    });
});
