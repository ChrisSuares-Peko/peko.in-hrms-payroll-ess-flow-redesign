const { getProductDetailsByIds } = require('../../../use-cases/cart');
const Products = require('../../../entities/products');

jest.mock('../../../entities/products', () => ({
    findAll: jest.fn(),
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));

describe('getProductDetailsByIds', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return product details when IDs are found', async () => {
        const mockIds = [1, 2, 3];
        const mockProducts = [
            { productId: 1, quantity: 10, price: 100 },
            { productId: 2, quantity: 5, price: 200 },
            { productId: 3, quantity: 8, price: 150 }
        ];

        Products.findAll.mockResolvedValue(mockProducts);

        const result = await getProductDetailsByIds(mockIds);

        expect(Products.findAll).toHaveBeenCalledWith({
            where: { id: mockIds },
            raw: true,
            attributes: [['id', 'productId'], 'quantity', 'price']
        });
        expect(result).toEqual(mockProducts);
    });

    it('should return false if no products are found', async () => {
        const mockIds = [99, 100];
        Products.findAll.mockResolvedValue(null);

        const result = await getProductDetailsByIds(mockIds);

        expect(result).toBe(false);
    });

    it('should throw an error if database query fails', async () => {
        const mockIds = [1, 2, 3];
        const mockError = new Error('Database error');

        Products.findAll.mockRejectedValue(mockError);

        await expect(getProductDetailsByIds(mockIds)).rejects.toThrow('Database error');
    });
});
