const { findAllActiveIndividualSubscriptions } = require('../../../use-cases/subscription'); 
const Subscription = require('../../../entities/subscription'); 
const Package = require('../../../entities/package'); 
const Cashback = require('../../../entities/cashback'); 
const { Op } = require('sequelize'); 

jest.mock('../../../entities/subscription', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../entities/package', () => ({
    // Mock Package model if needed for complex where clauses
}));

jest.mock('../../../entities/cashback', () => ({
    findAll: jest.fn(),
}));

describe('findAllActiveIndividualSubscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active individual subscriptions', async () => {
        const mockParams = { corporateId: 1, packageId: 2, currentPackageId: 3 };
        const mockServicesUnderAPackage = [{ serviceOperatorId: 4, packageId: 2 }];
        const mockIndividualPackages = [{ serviceOperatorId: 4, packageId: 5 }];
        const mockAllActiveIndividualSubscriptions = [{ id: 1, corporateUserId: 1, packageId: 5, status: 'ACTIVE', subscriptionPaymentRefId: 'ref123' }];

        Cashback.findAll.mockResolvedValueOnce(mockServicesUnderAPackage).mockResolvedValueOnce(mockIndividualPackages);
        Subscription.findAll.mockResolvedValue(mockAllActiveIndividualSubscriptions);

        const result = await findAllActiveIndividualSubscriptions(mockParams);

        expect(Cashback.findAll).toHaveBeenCalledWith({
            attributes: ["serviceOperatorId", "packageId"],
            where: { serviceStatus: true, packageId: mockParams.packageId },
            raw: true,
            nest: true,
        });
        expect(Cashback.findAll).toHaveBeenCalledWith({
            include: [
                {
                    model: Package,
                    where: { status: true, packageType: "INDIVIDUAL" },
                    attributes: ["id", "packageName"],
                },
            ],
            attributes: ["serviceOperatorId", "packageId"],
            where: {
                serviceStatus: true,
                serviceOperatorId: { [Op.in]: [4] }, // From mockServicesUnderAPackage
            },
            raw: true,
            nest: true,
        });
        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateId,
                packageId: { [Op.in]: [5, 3] }, // From mockIndividualPackages and currentPackageId
                status: "ACTIVE",
                subscriptionPaymentRefId: { [Op.ne]: null },
            },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockAllActiveIndividualSubscriptions);
    });

    it('should return empty array when no active individual subscriptions are found', async () => {
        const mockParams = { corporateId: 1, packageId: 2, currentPackageId: 3 };
        const mockServicesUnderAPackage = [];
        const mockIndividualPackages = [];

        Cashback.findAll.mockResolvedValueOnce(mockServicesUnderAPackage).mockResolvedValueOnce(mockIndividualPackages);
        Subscription.findAll.mockResolvedValue([]);

        const result = await findAllActiveIndividualSubscriptions(mockParams);

        expect(result).toEqual([]);
    });

    it('should handle errors during database operations', async () => {
        const mockParams = { corporateId: 1, packageId: 2, currentPackageId: 3 };
        const mockError = new Error('Database error');

        Cashback.findAll.mockRejectedValue(mockError); // Simulate error during Cashback.findAll

        const result = await findAllActiveIndividualSubscriptions(mockParams);

        expect(Cashback.findAll).toHaveBeenCalled();
        expect(result).toBe(false);
    });

        it('should handle errors during database operations on subscription', async () => {
        const mockParams = { corporateId: 1, packageId: 2, currentPackageId: 3 };
        const mockServicesUnderAPackage = [{ serviceOperatorId: 4, packageId: 2 }];
        const mockIndividualPackages = [{ serviceOperatorId: 4, packageId: 5 }];
        const mockError = new Error('Database error');

        Cashback.findAll.mockResolvedValueOnce(mockServicesUnderAPackage).mockResolvedValueOnce(mockIndividualPackages);
        Subscription.findAll.mockRejectedValue(mockError); // Simulate error during Subscription.findAll

        const result = await findAllActiveIndividualSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should handle missing params gracefully', async () => {
        await findAllActiveIndividualSubscriptions({}); // Empty params

        expect(Cashback.findAll).toHaveBeenCalled(); // Still call Cashback.findAll
        // You might want to add an expectation here depending on how you handle missing params.
        // If you throw an error, you'd use:
        // await expect(findAllActiveIndividualSubscriptions({})).rejects.toThrow();
    });

   

    it('should not push currentPackageId if it is same as packageId', async () => {
        const mockParams = { corporateId: 1, packageId: 2, currentPackageId: 2 }; // Same packageId

        Cashback.findAll.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
        Subscription.findAll.mockResolvedValue([]);

        const result = await findAllActiveIndividualSubscriptions(mockParams);

        expect(Subscription.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockParams.corporateId,
                packageId: { [Op.in]: [] }, // currentPackageId not pushed
                status: "ACTIVE",
                subscriptionPaymentRefId: { [Op.ne]: null },
            },
            raw: true,
            nest: true,
        });
        expect(result).toEqual([]);
    });
});