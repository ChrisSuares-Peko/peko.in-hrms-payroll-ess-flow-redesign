const category = require('../../../entities/category');
const { create } = require('../../category');

jest.mock('../../../entities/category', () => ({
    create: jest.fn(),
}));

describe('create', () => {
    it('should create a category successfully', async () => {
        // Mock input params
        const params = { categoryName: 'New Category' };

        // Mock response
        const mockResponse = { id: 1, categoryName: 'New Category' };

        // Mock implementation
        category.create.mockResolvedValue(mockResponse);

        // Call function
        const result = await create(params);

        // Expectations
        expect(category.create).toHaveBeenCalledTimes(1);
        expect(category.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockResponse);
    });

    it('should handle errors properly', async () => {
        // Mock input params
        const params = { categoryName: 'New Category' };

        // Mock rejection
        category.create.mockRejectedValue(new Error('Database error'));

        // Expect function to throw an error
        await expect(create(params)).rejects.toThrow('Database error');
    });
});
