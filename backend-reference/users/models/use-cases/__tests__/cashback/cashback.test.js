const { findAllUserAccessibleAccessKeys, findOneServiceCashbacks } = require('../../cashback');
const Cashback = require('../../../entities/cashback');
const Subscription = require('../../../entities/subscription');
const DisableServices = require('../../../entities/disabledService');
const Package = require('../../../entities/package');

jest.mock('../../../entities/cashback', () => ({
    findAll: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../entities/subscription', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/disabledService', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/package', () => ({
    findAll: jest.fn(),
}));

describe('cashback use-cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('findAllUserAccessibleAccessKeys', () => {
        it('should return accessible access keys for a user', async () => {
            const params = { userId: 1, currentPackageId: 10, corporateId: 100 };

            Subscription.findAll.mockResolvedValue([
                { packageId: 20 },
                { packageId: 30 },
            ]);
            Cashback.findAll.mockResolvedValue([
                { serviceOperatorId: 1, serviceOperator: { accessKey: 'key1' } },
                { serviceOperatorId: 2, serviceOperator: { accessKey: 'key2' } },
            ]);
            DisableServices.findAll.mockResolvedValue([]);

            const result = await findAllUserAccessibleAccessKeys(params);

            expect(result).toEqual(['key1', 'key2']);
            expect(Subscription.findAll).toHaveBeenCalled();
            expect(Cashback.findAll).toHaveBeenCalled();
            expect(DisableServices.findAll).toHaveBeenCalled();
        });

        it('should exclude disabled services', async () => {
            const params = { userId: 1, currentPackageId: 10, corporateId: 100 };

            Subscription.findAll.mockResolvedValue([{ packageId: 20 }]);
            Cashback.findAll.mockResolvedValue([
                { serviceOperatorId: 1, serviceOperator: { accessKey: 'key1' } },
                { serviceOperatorId: 2, serviceOperator: { accessKey: 'key2' } },
            ]);
            DisableServices.findAll.mockResolvedValue([
                { serviceOperatorId: 1, serviceOperator: { accessKey: 'key1' } },
            ]);

            const result = await findAllUserAccessibleAccessKeys(params);

            expect(result).toEqual(['key2']);
        });

        it('should return false when no subscriptions found', async () => {
            const params = { userId: 1, currentPackageId: 10, corporateId: 100 };
            Subscription.findAll.mockResolvedValue(null);

            const result = await findAllUserAccessibleAccessKeys(params);

            expect(result).toBe(false);
        });

        it('should return false when no cashbacks found', async () => {
            const params = { userId: 1, currentPackageId: 10, corporateId: 100 };
            Subscription.findAll.mockResolvedValue([{ packageId: 20 }]);
            Cashback.findAll.mockResolvedValue(null);

            const result = await findAllUserAccessibleAccessKeys(params);

            expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            const params = { userId: 1, currentPackageId: 10, corporateId: 100 };
            Subscription.findAll.mockRejectedValue(new Error('DB error'));

            const result = await findAllUserAccessibleAccessKeys(params);

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('findOneServiceCashbacks', () => {
        it('should return cashbacks for an access key', async () => {
            const mockCashbacks = [
                { unitPrice: 10, baseLimit: 100, packageId: 1 },
            ];
            Cashback.findAll.mockResolvedValue(mockCashbacks);

            const result = await findOneServiceCashbacks('test_key');

            expect(result).toEqual(mockCashbacks);
            expect(Cashback.findAll).toHaveBeenCalled();
        });

        it('should filter by partnerId when provided', async () => {
            Cashback.findAll.mockResolvedValue([]);

            await findOneServiceCashbacks('test_key', 'partner1');

            expect(Cashback.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: Package,
                            where: { partnerId: 'partner1' },
                        }),
                    ]),
                })
            );
        });

        it('should handle partnerId as "null" string', async () => {
            Cashback.findAll.mockResolvedValue([]);

            await findOneServiceCashbacks('test_key', 'null');

            expect(Cashback.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: Package,
                            where: { partnerId: null },
                        }),
                    ]),
                })
            );
        });

        it('should return false on error', async () => {
            Cashback.findAll.mockRejectedValue(new Error('DB error'));

            const result = await findOneServiceCashbacks('test_key');

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalled();
        });
    });
});
