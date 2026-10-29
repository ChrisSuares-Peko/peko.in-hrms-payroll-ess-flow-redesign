const { findPopularProduct } = require('../../order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('findPopularProduct', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return top product IDs sorted by total quantity', async () => {
        const mockOrders = [
            { orderResponse: JSON.stringify({ products: [{ productId: 'P1', productQuantity: 5 }, { productId: 'P2', productQuantity: 2 }] }) },
            { orderResponse: JSON.stringify({ products: [{ productId: 'P1', productQuantity: 3 }] }) },
        ];
        order.findAll.mockResolvedValue(mockOrders);

        const result = await findPopularProduct('e-commerce');
        expect(result).toEqual(['P1', 'P2']); // P1=8, P2=2
    });

    it('should return undefined on error', async () => {
        order.findAll.mockRejectedValue(new Error('DB error'));

        const result = await findPopularProduct('e-commerce');
        expect(result).toBeUndefined();
    });
});
