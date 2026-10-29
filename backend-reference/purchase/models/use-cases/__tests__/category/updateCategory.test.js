const category = require('../../../entities/category'); 
const { updateCategory } = require('../../category');
jest.mock('../../../entities/category', () => ({
    update: jest.fn(),
}));

describe('updateCategory', () => {
    it('should update category successfully', async () => {
        // Mock input params
        const params = { id: 1 };
        const data = { categoryName: 'Updated Category' };

        // Mock response (returns an array where the first element represents affected rows)
        const mockResponse = [1];

        // Mock implementation
        category.update.mockResolvedValue(mockResponse);

        // Call function
        const result = await updateCategory(params, data);

        // Expectations
        expect(category.update).toHaveBeenCalledTimes(1);
        expect(category.update).toHaveBeenCalledWith(data, {
            where: { id: params.id },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should handle errors properly', async () => {
        // Mock input params
        const params = { id: 1 };
        const data = { categoryName: 'Updated Category' };

        // Mock rejection
        category.update.mockRejectedValue(new Error('Database error'));

        // Expect function to throw an error
        await expect(updateCategory(params, data)).rejects.toThrow('Database error');
    });
});
