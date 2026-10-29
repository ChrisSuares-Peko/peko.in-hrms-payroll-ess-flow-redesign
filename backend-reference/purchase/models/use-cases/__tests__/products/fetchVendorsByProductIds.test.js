
const { fetchVendorsByProductIds } = require('../../products'); 
const product = require('../../../entities/products'); 

jest.mock('../../../entities/products', () => ({
    findAll: jest.fn(),
}));

describe('fetchVendorsByProductIds function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return vendors for given product IDs', async () => {
        // Mock values
        const productIds = [1, 2, 3];
        const mockVendorData = [
            { id: 1, name: 'Product A', vendors: 'Vendor A' },
            { id: 2, name: 'Product B', vendors: 'Vendor B' },
            { id: 3, name: 'Product C', vendors: 'Vendor C' },
        ];

        // Mock implementation
        product.findAll.mockResolvedValue(mockVendorData);

        const result = await fetchVendorsByProductIds(productIds);

        expect(product.findAll).toHaveBeenCalledWith({
            where: {
                id: [...productIds]
            },
            attributes: ['vendors', 'id', 'name'],
            raw: true
        });
        expect(result).toEqual(mockVendorData);
    });

    it('should handle case where no products are found', async () => {
        // Mock values
        const productIds = [4, 5, 6];

        // Mock implementation
        product.findAll.mockResolvedValue([]);

        const result = await fetchVendorsByProductIds(productIds);

        expect(product.findAll).toHaveBeenCalledWith({
            where: {
                id: [...productIds]
            },
            attributes: ['vendors', 'id', 'name'],
            raw: true
        });
        expect(result).toEqual([]);
    });

    it('should handle errors thrown by the product model', async () => {
        // Mock values
        const productIds = [7, 8, 9];
        const errorMessage = 'Database error';

        // Mock implementation
        product.findAll.mockRejectedValue(new Error(errorMessage));

        await expect(fetchVendorsByProductIds(productIds)).rejects.toThrow(errorMessage);

        expect(product.findAll).toHaveBeenCalledWith({
            where: {
                id: [...productIds]
            },
            attributes: ['vendors', 'id', 'name'],
            raw: true
        });
    });
});
