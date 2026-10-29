const { findWhatsappSubscriptions } = require('../../../use-cases/subscription');
const Subscription = require('../../../entities/subscription');


jest.mock('../../../entities/subscription', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/package', () => ({}));



describe('findWhatsappSubscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a direct WhatsApp subscription if found', async () => {
        const mockCorporateUserId = 1;
        const mockSubscription = {
            id: 1,
            corporateUserId: mockCorporateUserId,
            status: 'ACTIVE',
            package: {
                id: 1,
                packageName: 'WhatsApp Plan',
                accessCode: 'whatsapp',
            },
        };

        Subscription.findOne.mockResolvedValue(mockSubscription);

        const result = await findWhatsappSubscriptions(mockCorporateUserId);

        expect(Subscription.findOne).toHaveBeenCalledWith(expect.objectContaining({
            include: expect.any(Array),
            where: { corporateUserId: mockCorporateUserId, status: 'ACTIVE' },
            raw: true,
            nest: true,
        }));
        expect(result).toEqual(mockSubscription);
    });


    it('should return false if WhatsApp is not included in the group subscription', async () => {
        const mockCorporateUserId = 3;
        const mockGroupSubscription = {
            id: 3,
            corporateUserId: mockCorporateUserId,
            status: 'ACTIVE',
            package: {
                id: 3,
                packageName: 'Group Plan',
                packageType: 'GROUP',
            },
        };

        Subscription.findOne
            .mockResolvedValueOnce(null) // No direct WhatsApp subscription
            .mockResolvedValueOnce(mockGroupSubscription); // Group subscription found


        const result = await findWhatsappSubscriptions(mockCorporateUserId);

        expect(result).toBe(false);
    });

    it('should return false and log an error when an exception occurs', async () => {
        const mockCorporateUserId = 4;
        const mockError = new Error('Database error');

        Subscription.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findWhatsappSubscriptions(mockCorporateUserId);

        expect(console.error).toHaveBeenCalledWith('Error finding package details:', mockError);
        expect(result).toBe(false);
    });
});
