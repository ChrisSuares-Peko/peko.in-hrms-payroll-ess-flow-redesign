const { findOne } = require('../../systemUser'); // Adjust the path as needed
const systemUser = require('../../../entities/systemUser');

// Mock dependencies
jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));


describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mock history before each test
    });

    it('should successfully retrieve a user', async () => {
        const mockParams = { id: '12345' };
        const mockUser = { id: '12345', name: 'John Doe' };

        // Mock implementation
        systemUser.findOne.mockResolvedValue(mockUser);

        const result = await findOne(mockParams);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.id
            }
        });
        expect(result).toEqual(mockUser);
    });

    it('should return null if no user is found', async () => {
        const mockParams = { id: 'nonexistent' };

        // Mock implementation
        systemUser.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.id
            }
        });
        expect(result).toBeNull();
    });

    it('should handle errors', async () => {
        const mockParams = { id: '12345' };
        const mockError = new Error('Database error');

        // Mock implementation
        systemUser.findOne.mockRejectedValue(mockError);

        await expect(findOne(mockParams)).rejects.toThrow('Database error');
    });
});
