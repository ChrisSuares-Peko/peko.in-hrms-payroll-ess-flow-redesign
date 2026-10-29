const { findExistingGroupPackage } = require('../../../use-cases/subscription'); 
const Subscription = require('../../../entities/subscription'); 
const Package = require('../../../entities/package'); 

jest.mock('../../../entities/subscription', () => ({
    findOne: jest.fn(),
}));

describe('findExistingGroupPackage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the active group subscription when found', async () => {
        const mockCorporateUserId = 1;
        const mockActiveGroupSubscription = {
            id: 1,
            corporateUserId: mockCorporateUserId,
            package: {
                id: 10,
                packageName: 'Group Package',
            },
        };

        Subscription.findOne.mockResolvedValue(mockActiveGroupSubscription);

        const result = await findExistingGroupPackage(mockCorporateUserId);

        expect(Subscription.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: Package,
                    attributes: ["id", "packageName"],
                    where: { packageType: "GROUP" },
                },
            ],
            where: { status: "ACTIVE", corporateUserId: mockCorporateUserId, isCustom: false },
            attributes: ["id"],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockActiveGroupSubscription);
    });

    it('should return null when no active group subscription is found', async () => {
        const mockCorporateUserId = 1;

        Subscription.findOne.mockResolvedValue(null);

        const result = await findExistingGroupPackage(mockCorporateUserId);

        expect(Subscription.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: Package,
                    attributes: ["id", "packageName"],
                    where: { packageType: "GROUP" },
                },
            ],
            where: { status: "ACTIVE", corporateUserId: mockCorporateUserId, isCustom: false },
            attributes: ["id"],
            raw: true,
            nest: true,
        });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations', async () => {
        const mockCorporateUserId = 1;
        const mockError = new Error('Database error');

        Subscription.findOne.mockRejectedValue(mockError);

        await expect(findExistingGroupPackage(mockCorporateUserId)).rejects.toThrow(mockError); // Or handle as you prefer

        expect(Subscription.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: Package,
                    attributes: ["id", "packageName"],
                    where: { packageType: "GROUP" },
                },
            ],
            where: { status: "ACTIVE", corporateUserId: mockCorporateUserId, isCustom: false },
            attributes: ["id"],
            raw: true,
            nest: true,
        });
    });

   
});