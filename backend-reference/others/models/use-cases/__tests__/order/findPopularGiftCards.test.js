const { findPopularGiftCards } = require('../../order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('findPopularGiftCards', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return top gift card IDs sorted by popularity', async () => {
        const mockOrders = [
            { orderResponse: JSON.stringify({ body: { giftCardId: 'GC1' } }) },
            { orderResponse: JSON.stringify({ body: { giftCardId: 'GC1' } }) },
            { orderResponse: JSON.stringify({ body: { giftCardId: 'GC2' } }) },
        ];
        order.findAll.mockResolvedValue(mockOrders);

        const result = await findPopularGiftCards(['e-commerce']);
        expect(result).toEqual(['GC1', 'GC2']);
    });

    it('should return undefined on error', async () => {
        order.findAll.mockRejectedValue(new Error('DB error'));

        const result = await findPopularGiftCards(['e-commerce']);
        expect(result).toBeUndefined();
    });
});
