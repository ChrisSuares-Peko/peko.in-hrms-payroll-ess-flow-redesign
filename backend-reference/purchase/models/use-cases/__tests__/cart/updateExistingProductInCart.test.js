const { updateExistingProductInCart } = require('../../../use-cases/cart');
const Carts = require('../../../entities/cart');

jest.mock('../../../entities/cart', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
}));
jest.mock('../../../entities/products', () => ({
    belongsTo: jest.fn(),
}));

describe('updateExistingProductInCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should increase product quantity and update price and GST', async () => {
        const mockParams = { productId: 1, operation: 'increase', productQuantity: 1, corporateId: 123 };
        const mockCart = { productDetails: JSON.stringify([{ productId: 1, productQuantity: 1, totalPrice: 100, totalGst: 10 }]) };
        const unitPrice = 50;
        const unitGst = 5;

        Carts.findOne.mockResolvedValue(mockCart);
        Carts.update.mockResolvedValue([1]);

        const result = await updateExistingProductInCart(mockParams, unitPrice, unitGst);

        expect(Carts.findOne).toHaveBeenCalled();
        expect(Carts.update).toHaveBeenCalled();
        expect(result).toEqual({ newQuantity: 2 });
    });

    it('should decrease product quantity and update price and GST', async () => {
        const mockParams = { productId: 1, operation: 'decrease', productQuantity: 1, corporateId: 123 };
        const mockCart = { productDetails: JSON.stringify([{ productId: 1, productQuantity: 2, totalPrice: 100, totalGst: 10 }]) };
        const unitPrice = 50;
        const unitGst = 5;

        Carts.findOne.mockResolvedValue(mockCart);
        Carts.update.mockResolvedValue([1]);

        const result = await updateExistingProductInCart(mockParams, unitPrice, unitGst);

        expect(Carts.findOne).toHaveBeenCalled();
        expect(Carts.update).toHaveBeenCalled();
        expect(result).toEqual({ newQuantity: 1 });
    });

    it('should return -2 if the product is not in the cart', async () => {
        const mockParams = { productId: 99, operation: 'decrease', productQuantity: 1, corporateId: 123 };
        const mockCart = { productDetails: JSON.stringify([{ productId: 1, productQuantity: 2, totalPrice: 100, totalGst: 10 }]) };

        Carts.findOne.mockResolvedValue(mockCart);

        const result = await updateExistingProductInCart(mockParams, 50, 5);

        expect(result).toBe(-2);
    });

    it('should remove product from cart if quantity becomes zero', async () => {
        const mockParams = { productId: 1, operation: 'decrease', productQuantity: 2, corporateId: 123 };
        const mockCart = { productDetails: JSON.stringify([{ productId: 1, productQuantity: 2, totalPrice: 100, totalGst: 10 }]) };

        Carts.findOne.mockResolvedValue(mockCart);
        Carts.destroy.mockResolvedValue(1);

        const result = await updateExistingProductInCart(mockParams, 50, 5);

        expect(Carts.findOne).toHaveBeenCalled();
        expect(Carts.destroy).toHaveBeenCalled();
        expect(result).toBe(-1);
    });

    it('should return false if update fails', async () => {
        const mockParams = { productId: 1, operation: 'increase', productQuantity: 1, corporateId: 123 };
        const mockCart = { productDetails: JSON.stringify([{ productId: 1, productQuantity: 1, totalPrice: 100, totalGst: 10 }]) };
        
        Carts.findOne.mockResolvedValue(mockCart);
        Carts.update.mockResolvedValue(null);

        const result = await updateExistingProductInCart(mockParams, 50, 5);

        expect(result).toBe(false);
    });

    it('should throw an error if the database query fails', async () => {
        const mockParams = { productId: 1, operation: 'increase', productQuantity: 1, corporateId: 123 };
        const mockError = new Error('Database error');

        Carts.findOne.mockRejectedValue(mockError);

        await expect(updateExistingProductInCart(mockParams, 50, 5)).rejects.toThrow('Database error');
    });
});
