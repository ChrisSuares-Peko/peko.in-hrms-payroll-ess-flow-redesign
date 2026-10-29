// Import necessary modules
const { Delete } = require('../../edocs');
const edocs = require('../../../entities/edocs');

// Mock dependencies
jest.mock('../../../entities/edocs');

describe('Delete', () => {
    // Clear all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a document and return the result', async () => {
        const mockResult = 1; // Assuming the destroy method returns the number of rows affected
        edocs.destroy.mockResolvedValue(mockResult);

        const params = { id: 1 };
        const result = await Delete(params);

        expect(edocs.destroy).toHaveBeenCalledWith({
            where: { id: params.id }
        });

        expect(result).toBe(mockResult);
    });

    it('should handle errors and throw a custom error message', async () => {
        edocs.destroy.mockRejectedValue(new Error('Database error'));

        await expect(Delete({ id: 1 })).rejects.toThrow('Database error');
    });
});
