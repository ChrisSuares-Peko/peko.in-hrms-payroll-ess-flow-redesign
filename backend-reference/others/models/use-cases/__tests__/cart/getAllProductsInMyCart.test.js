const { getAllProductsInMyCart } = require('../../../use-cases/cart');
const Carts = require('../../../entities/cart');
const Products = require('../../../entities/products');

jest.mock('../../../entities/cart', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/products', () => ({
    findAll: jest.fn(),
}));

describe('getAllProductsInMyCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return product details in the cart when the cart exists', async () => {
        const corporateUserId = 1;
        const details = {}; // Any additional details if applicable
    
        const mockCart = {
            cartId: 123, // Matches the alias from the attributes array
            productDetails: JSON.stringify([
                { productId: 101, quantity: 2 },
                { productId: 102, quantity: 1 },
            ]),
        };
    
        const mockProducts = [
            {
                id: 101,
                name: 'Product 1',
                SKUCode: 'SKU101',
                price: 100,
                productImage: 'image1.png',
                brand: 'Brand A',
                GST: 18,
                gstType: 'inclusive',
            },
            {
                id: 102,
                name: 'Product 2',
                SKUCode: 'SKU102',
                price: 200,
                productImage: 'image2.png',
                brand: 'Brand B',
                GST: 18,
                gstType: 'exclusive',
            },
        ];
    
        Carts.findOne.mockResolvedValue(mockCart);
        Products.findAll.mockResolvedValue(mockProducts);
    
        const result = await getAllProductsInMyCart(corporateUserId, details);
    
        expect(Carts.findOne).toHaveBeenCalledWith({
            where: { corporateUserId },
            attributes: [['id', 'cartId'], 'productDetails'],
            raw: true,
        });
    
        expect(Products.findAll).toHaveBeenCalledWith({
            where: { id: [101, 102] },
            attributes: ['id', 'name', 'SKUCode', 'price', 'productImage', 'brand', 'GST', 'gstType'],
        });
    
        expect(result).toEqual({
            productsArray: [
                { productId: 101, quantity: 2 },
                { productId: 102, quantity: 1 },
            ],
            pics: mockProducts,
            cartId: 123,
        });
    });
    

    it('should return -1 if the cart does not exist', async () => {
        const corporateUserId = 1;
        const details = {}; // Any additional details if applicable

        Carts.findOne.mockResolvedValue(null);

        const result = await getAllProductsInMyCart(corporateUserId, details);

        expect(Carts.findOne).toHaveBeenCalledWith({
            where: { corporateUserId },
            attributes: [['id', 'cartId'], 'productDetails'],
            raw: true,
        });

        expect(result).toEqual(-1);
        expect(Products.findAll).not.toHaveBeenCalled();
    });

    it('should throw an error if fetching the cart fails', async () => {
        const corporateUserId = 1;
        const details = {}; // Any additional details if applicable

        const mockError = new Error('Database error');

        Carts.findOne.mockRejectedValue(mockError);

        await expect(getAllProductsInMyCart(corporateUserId, details)).rejects.toThrow('Database error');

        expect(Carts.findOne).toHaveBeenCalledWith({
            where: { corporateUserId },
            attributes: [['id', 'cartId'], 'productDetails'],
            raw: true,
        });

        expect(Products.findAll).not.toHaveBeenCalled();
    });

    it('should throw an error if fetching products fails', async () => {
        const corporateUserId = 1;
        const details = {}; // Any additional details if applicable

        const mockCart = {
            cartId: 123,
            productDetails: JSON.stringify([
                { productId: 101, quantity: 2 },
                { productId: 102, quantity: 1 },
            ]),
        };

        const mockError = new Error('Database error');

        Carts.findOne.mockResolvedValue({
            id: mockCart.cartId,
            productDetails: mockCart.productDetails,
        });

        Products.findAll.mockRejectedValue(mockError);

        await expect(getAllProductsInMyCart(corporateUserId, details)).rejects.toThrow('Database error');

        expect(Carts.findOne).toHaveBeenCalledWith({
            where: { corporateUserId },
            attributes: [['id', 'cartId'], 'productDetails'],
            raw: true,
        });

        expect(Products.findAll).toHaveBeenCalledWith({
            where: { id: [101, 102] },
            attributes: ['id', 'name', 'SKUCode', 'price', 'productImage', 'brand', 'GST', 'gstType'],
        });
    });
});
