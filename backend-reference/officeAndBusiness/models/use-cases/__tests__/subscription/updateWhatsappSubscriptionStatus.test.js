const { updateWhatsappSubscriptionStatus } = require('../../../use-cases/subscription');
const Subscription = require('../../../entities/subscription');

jest.mock('../../../entities/subscription', () => ({
    update: jest.fn(),
}));

describe('updateWhatsappSubscriptionStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return true when the subscription is successfully updated', async () => {
        const mockSubscriptionId = 1;
        const mockCorporateUserId = 10;
        const mockResponse = [1]; // 1 row affected

        Subscription.update.mockResolvedValue(mockResponse);

        const result = await updateWhatsappSubscriptionStatus(mockSubscriptionId, mockCorporateUserId);

        expect(Subscription.update).toHaveBeenCalledWith(
            { status: 'CANCELLED' },
            {
                where: {
                    id: mockSubscriptionId,
                    corporateUserId: mockCorporateUserId,
                },
            }
        );
        expect(result).toBe(true);
    });

    it('should return false when no subscription is updated', async () => {
        const mockSubscriptionId = 2;
        const mockCorporateUserId = 20;
        Subscription.update.mockResolvedValue([0]); // No rows affected

        const result = await updateWhatsappSubscriptionStatus(mockSubscriptionId, mockCorporateUserId);

        expect(result).toBe(true);
    });

    it('should return false and log an error when an exception occurs', async () => {
        const mockSubscriptionId = 3;
        const mockCorporateUserId = 30;
        const mockError = new Error('Database error');

        Subscription.update.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await updateWhatsappSubscriptionStatus(mockSubscriptionId, mockCorporateUserId);

        expect(console.error).toHaveBeenCalledWith('Error finding package details:', mockError);
        expect(result).toBe(false);
    });
});
