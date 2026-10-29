const category = require('../../../entities/category'); 
const { find } = require('../../category');

jest.mock('../../../entities/category', () => ({
    findOne: jest.fn(),
}));

describe('find', () => {
    it('should find a category successfully', async () => {
        // Mock input params
        const params = { id: 1 };

        // Mock response
        const mockResponse = { id: 1, categoryName: 'Electronics' };

        // Mock implementation
        category.findOne.mockResolvedValue(mockResponse);

        // Call function
        const result = await find(params);

        // Expectations
        expect(category.findOne).toHaveBeenCalledTimes(1);
        expect(category.findOne).toHaveBeenCalledWith({
            where: { id: params.id },
            raw: true,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should handle errors properly', async () => {
        // Mock input params
        const params = { id: 1 };

        // Mock rejection
        category.findOne.mockRejectedValue(new Error('Database error'));

        // Expect function to throw an error
        await expect(find(params)).rejects.toThrow('Database error');
    });
});
