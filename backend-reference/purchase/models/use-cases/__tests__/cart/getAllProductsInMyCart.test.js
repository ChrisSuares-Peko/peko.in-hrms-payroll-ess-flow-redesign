const { getAllProductsInMyCart } = require('../../../use-cases/cart');
const Carts = require('../../../entities/cart');
const Products = require('../../../entities/products');

jest.mock('../../../entities/cart', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/products', () => ({
    findAll: jest.fn(),
    belongsTo: jest.fn(),
}));


describe('getAllProductsInMyCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return products and cart ID when cart exists', async () => {
        const mockContext = { corporateUserId: 123 };
        const mockCart = {
            cartId: 1,
            productDetails: JSON.stringify([
                { productId: 1, productQuantity: 2 },
                { productId: 2, productQuantity: 1 }
            ])
        };
        const mockProducts = [
            { id: 1, name: 'Product A', SKUCode: 'A123', price: 100, productImage: 'imageA.jpg', brand: 'BrandA', GST: 5, gstType: 'Inclusive' },
            { id: 2, name: 'Product B', SKUCode: 'B123', price: 200, productImage: 'imageB.jpg', brand: 'BrandB', GST: 10, gstType: 'Exclusive' }
        ];

        Carts.findOne.mockResolvedValue(mockCart);
        Products.findAll.mockResolvedValue(mockProducts);

        const result = await getAllProductsInMyCart(mockContext);

        expect(Carts.findOne).toHaveBeenCalled();
        expect(Products.findAll).toHaveBeenCalled();
        expect(result).toEqual({
            productsArray: [
                { productId: 1, productQuantity: 2 },
                { productId: 2, productQuantity: 1 }
            ],
            pics: mockProducts,
            cartId: 1
        });
    });

    it('should return -1 if no cart exists', async () => {
        const mockContext = { corporateUserId: 123 };
        Carts.findOne.mockResolvedValue(null);

        const result = await getAllProductsInMyCart(mockContext);

        expect(Carts.findOne).toHaveBeenCalled();
        expect(result).toBe(-1);
    });

    it('should return an empty product list if cart exists but has no products', async () => {
        const mockContext = { corporateUserId: 123 };
        const mockCart = { cartId: 1, productDetails: JSON.stringify([]) };
        Carts.findOne.mockResolvedValue(mockCart);
        Products.findAll.mockResolvedValue([]);

        const result = await getAllProductsInMyCart(mockContext);

        expect(Carts.findOne).toHaveBeenCalled();
        expect(Products.findAll).toHaveBeenCalled();
        expect(result).toEqual({ productsArray: [], pics: [], cartId: 1 });
    });

    it('should throw an error if database query fails', async () => {
        const mockContext = { corporateUserId: 123 };
        const mockError = new Error('Database error');
        
        Carts.findOne.mockRejectedValue(mockError);
        
        await expect(getAllProductsInMyCart(mockContext)).rejects.toThrow('Database error');
    });
});
