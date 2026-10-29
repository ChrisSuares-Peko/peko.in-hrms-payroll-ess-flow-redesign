jest.mock('../../models/use-cases/serviceOperator', () => ({ findOne: jest.fn() }));
jest.mock('../../models/use-cases/disableService', () => ({ findOne: jest.fn() }));
jest.mock('../../models/use-cases/cashback', () => ({ findOne: jest.fn() }));
jest.mock('../../models/use-cases/subscription', () => ({
    findAllActiveSubscriptions: jest.fn(),
    findActiveIndividualBaseForService: jest.fn(),
}));
jest.mock('../../models/entities/serviceOperator', () => ({}));
jest.mock('../../models/entities/vendor', () => ({}));

const { findOne: findOneServiceOperator } = require('../../models/use-cases/serviceOperator');
const { findOne: findOneDisableService } = require('../../models/use-cases/disableService');
const { findOne: findOneCashback } = require('../../models/use-cases/cashback');
const subscriptionUC = require('../../models/use-cases/subscription');
const { fetchServiceDetails } = require('../checkAndFetchServiceDetails');

const args = { credentialId: 11, accessKey: 'corporate_cards', corporateUserId: 42 };

beforeEach(() => {
    jest.clearAllMocks();
    findOneServiceOperator.mockResolvedValue({ id: 7 });
    findOneDisableService.mockResolvedValue(null);
    subscriptionUC.findAllActiveSubscriptions.mockResolvedValue([
        { packageId: 1 },
        { packageId: 120 },
    ]);
});

describe('fetchServiceDetails', () => {
    it('prices from the INDIVIDUAL package when the corporate holds one for this service', async () => {
        subscriptionUC.findActiveIndividualBaseForService.mockResolvedValue({ packageId: 120 });
        findOneCashback.mockResolvedValue({ id: 99, baseLimit: '5.00', unitPrice: '199.00' });

        const result = await fetchServiceDetails(args);

        expect(subscriptionUC.findActiveIndividualBaseForService).toHaveBeenCalledWith({
            corporateUserId: 42,
            serviceOperatorId: 7,
        });
        expect(findOneCashback).toHaveBeenCalledTimes(1);
        expect(findOneCashback).toHaveBeenCalledWith({
            packageIds: [120],
            serviceOperatorId: 7,
        });
        expect(result).toEqual({ id: 7, baseLimit: '5.00', unitPrice: '199.00' });
    });

    it('prices from the group plan when the corporate holds no individual package', async () => {
        subscriptionUC.findActiveIndividualBaseForService.mockResolvedValue(null);
        findOneCashback.mockResolvedValue({ id: 99, baseLimit: '0.00', unitPrice: '290.00' });

        const result = await fetchServiceDetails(args);

        expect(findOneCashback).toHaveBeenCalledWith({
            packageIds: [1, 120],
            serviceOperatorId: 7,
        });
        expect(result).toEqual({ id: 7, baseLimit: '0.00', unitPrice: '290.00' });
    });

    it('falls back to the group plan when the individual package has no listable cashback row', async () => {
        subscriptionUC.findActiveIndividualBaseForService.mockResolvedValue({ packageId: 120 });
        findOneCashback
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 99, unitPrice: '290.00' });

        expect(await fetchServiceDetails(args)).toEqual({ id: 7, unitPrice: '290.00' });
        expect(findOneCashback).toHaveBeenLastCalledWith({
            packageIds: [1, 120],
            serviceOperatorId: 7,
        });
    });

    it('throws rather than charging group rates when the individual cashback read swallowed a DB error', async () => {
        subscriptionUC.findActiveIndividualBaseForService.mockResolvedValue({ packageId: 120 });
        findOneCashback.mockResolvedValue(undefined);

        await expect(fetchServiceDetails(args)).rejects.toThrow('Failed to read cashback');
        expect(findOneCashback).toHaveBeenCalledTimes(1);
    });

    it('reports the service as unavailable when no active package covers it', async () => {
        subscriptionUC.findActiveIndividualBaseForService.mockResolvedValue(null);
        findOneCashback.mockResolvedValue(null);

        expect(await fetchServiceDetails(args)).toEqual({
            error: 'Unable to process your request',
        });
    });

    it('never reaches the entitlement lookups for a disabled service', async () => {
        findOneDisableService.mockResolvedValue({ id: 1 });

        expect(await fetchServiceDetails(args)).toEqual({ error: 'Service is disabled' });
        expect(subscriptionUC.findActiveIndividualBaseForService).not.toHaveBeenCalled();
        expect(findOneCashback).not.toHaveBeenCalled();
    });
});
