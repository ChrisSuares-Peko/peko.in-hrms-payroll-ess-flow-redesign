const category = require('../../../entities/category');
const { deleteCategory } = require('../../category');

jest.mock('../../../entities/category', () => ({
    destroy: jest.fn(),
}));

describe('deleteCategory', () => {
    it('should delete a category successfully', async () => {
        // Mock input params
        const params = { id: 1 };

        // Mock response (number of affected rows)
        const mockResponse = 1;

        // Mock implementation
        category.destroy.mockResolvedValue(mockResponse);

        // Spy on console.log
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Call function
        const result = await deleteCategory(params);

        // Expectations
        expect(category.destroy).toHaveBeenCalledTimes(1);
        expect(category.destroy).toHaveBeenCalledWith({ where: { id: params.id } });
        expect(result).toEqual(mockResponse);
        expect(consoleSpy).toHaveBeenCalledWith('CATEGORY DELETE ROUTE CALLED');

        // Restore console.log
        consoleSpy.mockRestore();
    });

    it('should log an error message when deletion fails', async () => {
        // Mock input params
        const params = { id: 1 };

        // Mock rejection
        const mockError = new Error('Database error');
        category.destroy.mockRejectedValue(mockError);

        // Spy on console.log
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Call function
        await deleteCategory(params);

        expect(category.destroy).toHaveBeenCalledWith({ where: { id: params.id } });

        expect(consoleSpy).toHaveBeenCalledWith('CATEGORY DELETE ROUTE CALLED');

        // Restore console.log
        consoleSpy.mockRestore();
    });
});
