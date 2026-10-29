const { findOne } = require('../../systemUser'); // Adjust the path as necessary
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser');

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a system user when a valid credentialId is provided', async () => {
        const mockParams = { id: 1 };
        const mockUser = { id: 1, name: 'Test User', credentialId: 1 };

        systemUser.findOne.mockResolvedValue(mockUser);

        const result = await findOne(mockParams);

        expect(systemUser.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { credentialId: mockParams.id },
            })
        );

        expect(result).toEqual(mockUser);
    });

    it('should return null when no system user is found for the given credentialId', async () => {
        const mockParams = { id: 2 };

        systemUser.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(systemUser.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { credentialId: mockParams.id },
            })
        );

        expect(result).toBeNull();
    });

    it('should throw an error if there is an issue with the database query', async () => {
        const mockParams = { id: 1 };
        const mockError = new Error('Database error');

        systemUser.findOne.mockRejectedValue(mockError);

        await expect(findOne(mockParams)).rejects.toThrow('Database error');

        expect(systemUser.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { credentialId: mockParams.id },
            })
        );
    });
});
