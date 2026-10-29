const { findActiveSubscriptionByCredentialId } = require('../../../use-cases/whatsappBusiness');
const WhatsAppSubscription = require('../../../entities/whatsAppSubscription');
const pkgModel = require('../../../entities/package');
const { Op } = require('sequelize');

jest.mock('../../../entities/whatsAppSubscription', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    hasOne: jest.fn(),
}));

describe('findActiveSubscriptionByCredentialId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an active subscription when found', async () => {
        const mockCredentialId = 1;
        const mockResponse = {
            id: 10,
            subscriptionStartDate: '2024-01-01',
            subscriptionEndDate: '2024-12-31',
            subscriptionAmountPaid: 200,
            status: 'ACTIVE',
            projectId: '12345',
            billingPlan: 'Annual',
            billingType: 'PREPAID',
            pkgModel: {
                id: 5,
                packageName: 'Premium Package',
                packageType: 'PREMIUM',
                description: 'Test description',
                serviceList: ['Service1', 'Service2'],
                packageLogo: 'https://example.com/logo.png',
            },
        };

        WhatsAppSubscription.findOne.mockResolvedValue(mockResponse);

        const result = await findActiveSubscriptionByCredentialId(mockCredentialId);

        expect(WhatsAppSubscription.findOne).toHaveBeenCalledWith({
            where: expect.objectContaining({
                credentialId: mockCredentialId,
                subscriptionPaymentRefId: { [Op.ne]: null },
            }),
            include: [
                {
                    model: pkgModel,
                    attributes: ['id', 'packageName', 'packageType', 'description', 'serviceList', 'packageLogo'],
                },
            ],
            attributes: expect.arrayContaining([
                'id', 'subscriptionStartDate', 'subscriptionEndDate', 'subscriptionAmountPaid', 'status', 'projectId', 'billingPlan', 'billingType'
            ]),
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return null when no active subscription is found', async () => {
        const mockCredentialId = 2;
        WhatsAppSubscription.findOne.mockResolvedValue(null);

        const result = await findActiveSubscriptionByCredentialId(mockCredentialId);

        expect(result).toBeNull();
    });

    it('should return null when an error occurs', async () => {
        const mockCredentialId = 3;
        const mockError = new Error('Database error');

        WhatsAppSubscription.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findActiveSubscriptionByCredentialId(mockCredentialId);

        expect(console.error).toHaveBeenCalledWith('Error finding active subscription:', mockError);
        expect(result).toBeNull();
    });
});
