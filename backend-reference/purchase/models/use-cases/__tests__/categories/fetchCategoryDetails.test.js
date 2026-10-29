const { fetchCategoryDetails } = require('../../categories'); 
const categories = require('../../../entities/categories'); 
const { Op } = require('sequelize');

jest.mock('../../../entities/categories', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../entities/products', () =>({
    belongsTo: jest.fn(),
    }));
    jest.mock('../../../entities/subCorporateUsers', () =>({
        belongsTo: jest.fn(),
        }));

describe('fetchCategoryDetails function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch category details based on the query parameter', async () => {
        const query = 'Electronics';
        const mockCategories = [
            { id: 1, categoryName: 'Electronics' },
            { id: 2, categoryName: 'Electronics Accessories' }
        ];

        // Mock implementation
        categories.findAll.mockResolvedValue(mockCategories);

        const result = await fetchCategoryDetails(query);

        expect(categories.findAll).toHaveBeenCalledWith({
            where: {
                categoryName: {
                    [Op.like]: `%${query}%`
                }
            },
            attributes: ['id', 'categoryName']
        });
        expect(result).toEqual(mockCategories);
    });

    it('should handle empty results if no categories match the query', async () => {
        const query = 'Nonexistent Category';
        const mockCategories = [];

        // Mock implementation
        categories.findAll.mockResolvedValue(mockCategories);

        const result = await fetchCategoryDetails(query);

        expect(categories.findAll).toHaveBeenCalledWith({
            where: {
                categoryName: {
                    [Op.like]: `%${query}%`
                }
            },
            attributes: ['id', 'categoryName']
        });
        expect(result).toEqual(mockCategories);
    });

    it('should handle errors from the database query', async () => {
        const query = 'Electronics';
        const errorMessage = 'Database query failed';

        // Mock implementation
        categories.findAll.mockRejectedValue(new Error(errorMessage));

        await expect(fetchCategoryDetails(query)).rejects.toThrow(errorMessage);
    });
});
