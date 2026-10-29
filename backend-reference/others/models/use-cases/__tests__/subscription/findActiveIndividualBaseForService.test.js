const { findActiveIndividualBaseForService } = require('../../subscription');
const Subscription = require('../../../entities/subscription');
const Package = require('../../../entities/package');

jest.mock('../../../entities/subscription', () => ({
    findOne: jest.fn(),
}));

describe('findActiveIndividualBaseForService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('scopes to the ACTIVE INDIVIDUAL base row stamped with this serviceOperatorId', async () => {
        Subscription.findOne.mockResolvedValue({ packageId: 120 });

        const result = await findActiveIndividualBaseForService({
            corporateUserId: 42,
            serviceOperatorId: 7,
        });

        const options = Subscription.findOne.mock.calls[0][0];
        expect(options.where).toEqual({
            corporateUserId: 42,
            serviceOperatorId: 7,
            status: 'ACTIVE',
            isCustom: false,
        });
        expect(options.include[0].model).toBe(Package);
        expect(options.include[0].where).toEqual({ packageType: 'INDIVIDUAL' });
        expect(options.include[0].required).toBe(true);
        expect(options.attributes).toEqual(['packageId']);
        expect(result).toEqual({ packageId: 120 });
    });

    it('returns null when the corporate holds no individual package for the service', async () => {
        Subscription.findOne.mockResolvedValue(null);

        expect(
            await findActiveIndividualBaseForService({ corporateUserId: 42, serviceOperatorId: 7 })
        ).toBeNull();
    });

    it('rejects instead of swallowing a DB error', async () => {
        Subscription.findOne.mockRejectedValue(new Error('Database error'));

        await expect(
            findActiveIndividualBaseForService({ corporateUserId: 42, serviceOperatorId: 7 })
        ).rejects.toThrow('Database error');
    });
});
