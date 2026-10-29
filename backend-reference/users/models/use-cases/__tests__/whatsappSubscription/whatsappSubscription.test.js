const { findWhatsAppSubscription, cancelWhatsAppSubscription } = require('../../whatsappSubscription');
const WhatsAppSubscription = require('../../../entities/whatsappSubscription');

jest.mock('../../../entities/whatsappSubscription', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

describe('whatsappSubscription use-cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('findWhatsAppSubscription', () => {
        it('should find a WhatsApp subscription by id and corporateId', async () => {
            const mockSubscription = { id: 1, corporateUserId: 100 };
            WhatsAppSubscription.findOne.mockResolvedValue(mockSubscription);

            const result = await findWhatsAppSubscription({ subscriptionId: 1, corporateId: 100 });

            expect(WhatsAppSubscription.findOne).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    corporateUserId: 100,
                },
                raw: true,
                nest: true,
            });
            expect(result).toEqual(mockSubscription);
        });

        it('should return null when subscription not found', async () => {
            WhatsAppSubscription.findOne.mockResolvedValue(null);

            const result = await findWhatsAppSubscription({ subscriptionId: 999, corporateId: 100 });

            expect(result).toBeNull();
        });

        it('should return false on error', async () => {
            WhatsAppSubscription.findOne.mockRejectedValue(new Error('DB error'));

            const result = await findWhatsAppSubscription({ subscriptionId: 1, corporateId: 100 });

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('cancelWhatsAppSubscription', () => {
        it('should cancel a WhatsApp subscription successfully', async () => {
            WhatsAppSubscription.update.mockResolvedValue([1]);

            const result = await cancelWhatsAppSubscription({ subscriptionId: 1 });

            expect(WhatsAppSubscription.update).toHaveBeenCalledWith(
                { isCancelled: true },
                { where: { id: 1 } }
            );
            expect(result).toEqual({
                success: true,
                message: 'Your subscription has been cancelled. You will still be able to use the service until the end of your current billing cycle.',
            });
        });

        it('should return false on error', async () => {
            WhatsAppSubscription.update.mockRejectedValue(new Error('DB error'));

            const result = await cancelWhatsAppSubscription({ subscriptionId: 1 });

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalled();
        });
    });
});
