const { deleteExistingProductInCart } = require('../../../use-cases/cart');
const Carts = require('../../../entities/cart');

jest.mock('../../../entities/cart', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
}));
jest.mock('../../../entities/products', () => ({
    belongsTo: jest.fn(),
}));

describe('deleteExistingProductInCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a product from the cart and return its quantity', async () => {
        const mockProductId = 1;
        const mockContext = { corporateUserId: 123 };
        const mockCart = { productDetails: JSON.stringify([{ productId: 1, productQuantity: 2 }]) };

        Carts.findOne.mockResolvedValue(mockCart);
        Carts.update.mockResolvedValue([1]);

        const result = await deleteExistingProductInCart(mockProductId, mockContext);

        expect(Carts.findOne).toHaveBeenCalled();
        expect(Carts.update).toHaveBeenCalled();
        expect(result).toBe(2);
    });

    it('should return -2 if the product is not found in the cart', async () => {
        const mockProductId = 99;
        const mockContext = { corporateUserId: 123 };
        const mockCart = { productDetails: JSON.stringify([{ productId: 1, productQuantity: 2 }]) };

        Carts.findOne.mockResolvedValue(mockCart);

        const result = await deleteExistingProductInCart(mockProductId, mockContext);

        expect(result).toBe(-2);
    });

    it('should return -1 if the last product in the cart is removed and the cart is deleted', async () => {
        const mockProductId = 1;
        const mockContext = { corporateUserId: 123 };
        const mockCart = { productDetails: JSON.stringify([{ productId: 1, productQuantity: 2 }]) };

        Carts.findOne.mockResolvedValue(mockCart);
        Carts.destroy.mockResolvedValue(1);

        const result = await deleteExistingProductInCart(mockProductId, mockContext);

        expect(Carts.destroy).toHaveBeenCalled();
        expect(result).toBe(-1);
    });

    it('should return false if the cart does not exist', async () => {
        const mockProductId = 1;
        const mockContext = { corporateUserId: 123 };

        Carts.findOne.mockResolvedValue(null);

        const result = await deleteExistingProductInCart(mockProductId, mockContext);

        expect(result).toBe(false);
    });

    it('should return 0 if product quantity is 0', async () => {
        const mockProductId = 1;
        const mockContext = { corporateUserId: 123 };
        const mockCart = { productDetails: JSON.stringify([{ productId: 1, productQuantity: 0 }]) };

        Carts.findOne.mockResolvedValue(mockCart);

        const result = await deleteExistingProductInCart(mockProductId, mockContext);

        expect(result).toBe(0);
    });

    it('should throw an error if the database query fails', async () => {
        const mockProductId = 1;
        const mockContext = { corporateUserId: 123 };
        const mockError = new Error('Database error');

        Carts.findOne.mockRejectedValue(mockError);

        await expect(deleteExistingProductInCart(mockProductId, mockContext)).rejects.toThrow('Database error');
    });
});
