const { findAndCountAllUserSubscriptions } = require('../../../use-cases/whatsappBusiness');
const WhatsAppSubscription = require('../../../entities/whatsAppSubscription');
const pkgModel = require('../../../entities/package');
const { Op } = require('sequelize');

jest.mock('../../../entities/whatsAppSubscription', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    hasOne: jest.fn(),
}));

describe('findAndCountAllUserSubscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return user subscriptions when found', async () => {
        const mockParams = {
            corporateId: 1,
            limit: 10,
            offset: 0,
            status: 'ACTIVE',
            packageType: 'INDIVIDUAL',
        };
        const mockResponse = {
            count: 2,
            rows: [
                {
                    id: 1,
                    subscriptionStartDate: '2024-01-01',
                    subscriptionEndDate: '2025-01-01',
                    subscriptionAmountPaid: 100,
                    status: 'ACTIVE',
                    billingType: 'MONTHLY',
                    pkgModel: {
                        id: 10,
                        packageName: 'Basic Plan',
                        packageType: 'INDIVIDUAL',
                        description: 'Test Package',
                        serviceList: ['Messaging', 'Voice'],
                        packageLogo: 'https://example.com/logo.png',
                    },
                },
            ],
        };

        WhatsAppSubscription.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAndCountAllUserSubscriptions(mockParams);

        expect(WhatsAppSubscription.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: pkgModel,
                    attributes: ['id', 'packageName', 'packageType', 'description', 'serviceList', 'packageLogo'],
                    where: { packageType: mockParams.packageType },
                },
            ],
            where: expect.objectContaining({
                corporateUserId: mockParams.corporateId,
                subscriptionPaymentRefId: { [Op.ne]: null },
                status: mockParams.status,
            }),
            attributes: [
                'id', 'subscriptionStartDate', 'subscriptionEndDate', 'subscriptionAmountPaid', 'status', 'billingType', 'isCustom', 'subscriptionPaymentRefId'
            ],
            limit: mockParams.limit,
            offset: mockParams.offset,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty result when no subscriptions are found', async () => {
        const mockParams = { corporateId: 2, limit: 5, offset: 0 };
        WhatsAppSubscription.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAndCountAllUserSubscriptions(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should return false when an error occurs', async () => {
        const mockParams = { corporateId: 3 };
        const mockError = new Error('Database error');

        WhatsAppSubscription.findAndCountAll.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findAndCountAllUserSubscriptions(mockParams);

        expect(console.error).toHaveBeenCalledWith('Error finding package details:', mockError);
        expect(result).toBe(false);
    });
});
