const { findCategory } = require('../../categories'); 
const product = require('../../../entities/products'); 

jest.mock('../../../entities/products', () => ({
    findAll: jest.fn(),
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () =>({
    belongsTo: jest.fn(),
    }));


describe('findCategory function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return products associated with the given category ID', async () => {
        const categoryId = 1;
        const mockProducts = [
            { id: 1, name: 'Product A', categoryId: 1 },
            { id: 2, name: 'Product B', categoryId: 1 }
        ];

        // Mock implementation
        product.findAll.mockResolvedValue(mockProducts);

        const result = await findCategory(categoryId);

        expect(product.findAll).toHaveBeenCalledWith({
            where: {
                categoryId: categoryId
            },
            raw: true
        });
        expect(result).toEqual(mockProducts);
    });

    it('should return an empty array if no products are found for the given category ID', async () => {
        const categoryId = 1;

        // Mock implementation
        product.findAll.mockResolvedValue([]);

        const result = await findCategory(categoryId);

        expect(result).toEqual([]);  // Expect an empty array if no products are found
    });
});
