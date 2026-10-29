const category = require('../../../entities/category');
const { fetchCategory } = require('../../category');
const { Op } = require('sequelize');

jest.mock('../../../entities/category', () => ({
    findAll: jest.fn(),
}));

describe('fetchCategory', () => {
    it('should fetch categories successfully', async () => {
        // Mock input query
        const query = 'Electronics';

        // Mock response
        const mockResponse = [
            { id: 1, categoryName: 'Electronics' },
            { id: 2, categoryName: 'Electronic Devices' }
        ];

        // Mock implementation
        category.findAll.mockResolvedValue(mockResponse);

        // Call function
        const result = await fetchCategory(query);

        // Expectations
        expect(category.findAll).toHaveBeenCalledTimes(1);
        expect(category.findAll).toHaveBeenCalledWith({
            where: {
                categoryName: { [Op.like]: `%${query}%` }
            },
            attributes: ['id', 'categoryName']
        });
        expect(result).toEqual(mockResponse);
    });

    it('should handle errors properly', async () => {
        // Mock input query
        const query = 'Electronics';

        // Mock rejection
        const mockError = new Error('Database error');
        category.findAll.mockRejectedValue(mockError);

        // Expect function to throw an error
        await expect(fetchCategory(query)).rejects.toThrow('Database error');
    });
});
