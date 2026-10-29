const category = require('../../../entities/category');
const { findAllCategory } = require('../../category'); 

jest.mock('../../../entities/category', () => ({
    findAll: jest.fn(),
}));

describe('findAllCategory', () => {
    it('should return all categories', async () => {
        // Mock data
        const mockCategories = [{ id: 1, name: 'Electronics' }, { id: 2, name: 'Books' }];
        
        // Mock category.findAll to return the mock data
        category.findAll.mockResolvedValue(mockCategories);

        // Call the function
        const result = await findAllCategory();

        // Expectations
        expect(category.findAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockCategories);
    });

    it('should handle errors properly', async () => {
        // Mock an error scenario
        category.findAll.mockRejectedValue(new Error('Database error'));
        // Ensure the function was called
        await expect(category.findAll).rejects.toThrow('Database error');
    });
});
