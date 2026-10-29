const { update } = require('../../edocs');
const edocs = require('../../../entities/edocs');

// Mock dependencies
jest.mock('../../../entities/edocs');

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a document and return the result', async () => {
        // Mocked response from edocs.update
        const mockResult = [1]; // Sequelize update returns an array, where the first element is the number of rows updated
        edocs.update.mockResolvedValue(mockResult);

        const params = { id: 1 };
        const data = { documentName: 'Updated Document Name' };

        const result = await update(params, data);

        // Check if edocs.update was called with the correct arguments
        expect(edocs.update).toHaveBeenCalledWith(data, {
            where: { id: params.id },
        });

        // Validate the returned result
        expect(result).toEqual(mockResult);
    });

    it('should handle errors and throw a custom error message', async () => {
        // Mocked error
        const error = new Error('Database error');
        edocs.update.mockRejectedValue(error);

        const params = { id: 1 };
        const data = { documentName: 'Invalid Data' };

        await expect(update(params, data)).rejects.toThrow('Database error');

        // Ensure edocs.update was called
        expect(edocs.update).toHaveBeenCalledWith(data, {
            where: { id: params.id },
        });
    });
});
