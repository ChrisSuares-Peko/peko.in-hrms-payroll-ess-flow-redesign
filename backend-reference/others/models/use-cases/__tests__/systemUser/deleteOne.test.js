const { deleteOne } = require('../../systemUser'); // Update the path as needed
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser');

describe('deleteOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a user with the given id and return the number of deleted rows', async () => {
        const mockParams = { id: 1 };
        const mockResult = 1; // Number of rows deleted

        systemUser.destroy.mockResolvedValue(mockResult);

        const result = await deleteOne(mockParams);

        expect(systemUser.destroy).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
        });
        expect(result).toEqual(mockResult);
    });

    it('should return 0 if no user is found with the given id', async () => {
        const mockParams = { id: 999 };
        const mockResult = 0; // No rows deleted

        systemUser.destroy.mockResolvedValue(mockResult);

        const result = await deleteOne(mockParams);

        expect(systemUser.destroy).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
        });
        expect(result).toEqual(mockResult);
    });

    it('should throw an error if the database query fails', async () => {
        const mockParams = { id: 1 };
        const mockError = new Error('Database error');

        systemUser.destroy.mockRejectedValue(mockError);

        await expect(deleteOne(mockParams)).rejects.toThrow('Database error');
        expect(systemUser.destroy).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
        });
    });
});
