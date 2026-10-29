const { addNewProductInCart } = require('../../../use-cases/cart');
const Carts = require('../../../entities/cart');

jest.mock('../../../entities/cart', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
}));
jest.mock('../../../entities/products', () => ({
    belongsTo: jest.fn(),
}));

describe('addNewProductInCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should add a new product to an existing cart when no duplicate is found', async () => {
        const mockParams = { productId: 1, productQuantity: 2, totalPrice: 100, totalGst: 10 };
        const mockContext = { corporateId: 123, subCorporateId: null };
        const mockCart = { productDetails: JSON.stringify([]) };

        Carts.findOne.mockResolvedValue(mockCart);
        Carts.update.mockResolvedValue([1]);

        const result = await addNewProductInCart(mockParams, mockContext);

        expect(Carts.findOne).toHaveBeenCalledWith({
            where: { corporateUserId: mockContext.corporateId },
            attributes: ['productDetails'],
        });
        expect(Carts.update).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('should update the product quantity if the product already exists in the cart', async () => {
        const mockParams = { productId: 1, productQuantity: 2, totalPrice: 100, totalGst: 10 };
        const mockContext = { corporateId: 123, subCorporateId: null };
        const mockCart = { productDetails: JSON.stringify([{ productId: 1, productQuantity: 1, totalPrice: 50, totalGst: 5 }]) };

        Carts.findOne.mockResolvedValue(mockCart);
        Carts.update.mockResolvedValue([1]);

        const result = await addNewProductInCart(mockParams, mockContext);

        expect(Carts.findOne).toHaveBeenCalled();
        expect(Carts.update).toHaveBeenCalled();
        expect(result).toBe('duplicate');
    });

    it('should create a new cart if none exists for the corporate user', async () => {
        const mockParams = { productId: 1, productQuantity: 2, totalPrice: 100, totalGst: 10 };
        const mockContext = { corporateId: 123, subCorporateId: null };

        Carts.findOne.mockResolvedValue(null);
        Carts.create.mockResolvedValue(true);

        const result = await addNewProductInCart(mockParams, mockContext);

        expect(Carts.create).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('should return false if cart creation fails', async () => {
        const mockParams = { productId: 1, productQuantity: 2, totalPrice: 100, totalGst: 10 };
        const mockContext = { corporateId: 123, subCorporateId: null };

        Carts.findOne.mockResolvedValue(null);
        Carts.create.mockResolvedValue(null);

        const result = await addNewProductInCart(mockParams, mockContext);

        expect(Carts.create).toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should throw an error if the database query fails', async () => {
        const mockParams = { productId: 1, productQuantity: 2, totalPrice: 100, totalGst: 10 };
        const mockContext = { corporateId: 123, subCorporateId: null };
        const mockError = new Error('Database error');

        Carts.findOne.mockRejectedValue(mockError);

        await expect(addNewProductInCart(mockParams, mockContext)).rejects.toThrow('Database error');
    });
});
