const { deleteCartAndUpdateProducts } = require('../../../use-cases/cart');
const Carts = require('../../../entities/cart');
const Products = require('../../../entities/products');

jest.mock('@logtail/node', () => {
    return {
        Logtail: jest.fn().mockImplementation(() => {
            return {
                // Mock methods of Logtail if needed
                info: jest.fn(),
                error: jest.fn(),
            };
        }),
    };
});
jest.mock('../../../entities/cart', () => ({
    findOne: jest.fn(),
    destroy: jest.fn(),
}));

jest.mock('../../../entities/products', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../../configs/database/index', () => ({
    transaction: jest.fn((callback) => callback({ LOCK: { UPDATE: 'UPDATE' } })),
}));

describe('deleteCartAndUpdateProducts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete the cart and update product quantities', async () => {
        const mockContext = { corporateUserId: 123 };
        const mockCart = {
            productDetails: JSON.stringify([
                { productId: 1, productQuantity: 2 },
                { productId: 2, productQuantity: 3 }
            ])
        };
        const mockProduct1 = { quantity: 10, sold_quantity: 5 };
        const mockProduct2 = { quantity: 8, sold_quantity: 2 };

        Carts.findOne.mockResolvedValue(mockCart);
        Carts.destroy.mockResolvedValue(1);
        Products.findOne.mockResolvedValueOnce(mockProduct1).mockResolvedValueOnce(mockProduct2);
        Products.update.mockResolvedValue([1]);

        const result = await deleteCartAndUpdateProducts(mockContext);

        expect(Carts.findOne).toHaveBeenCalled();
        expect(Carts.destroy).toHaveBeenCalled();
        expect(Products.findOne).toHaveBeenCalledTimes(2);
        expect(Products.update).toHaveBeenCalledTimes(2);
        expect(result).toEqual([
            { productId: 1, productQuantity: 2 },
            { productId: 2, productQuantity: 3 }
        ]);
    });

    it('should return an empty array if no cart exists', async () => {
        const mockContext = { corporateUserId: 123 };
        Carts.findOne.mockResolvedValue(null);

        const result = await deleteCartAndUpdateProducts(mockContext);

        expect(Carts.findOne).toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it('should throw an error if a database query fails', async () => {
        const mockContext = { corporateUserId: 123 };
        const mockError = new Error('Database error');
        
        Carts.findOne.mockRejectedValue(mockError);
        
        await expect(deleteCartAndUpdateProducts(mockContext)).rejects.toThrow('Database error');
    });
});
