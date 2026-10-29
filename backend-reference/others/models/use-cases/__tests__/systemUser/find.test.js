const { find } = require('../../systemUser'); // Update the path as needed
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser');

describe('find', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the user for a valid email', async () => {
        const mockParams = { email: 'test@example.com' };
        const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };

        systemUser.findOne.mockResolvedValue(mockUser);

        const result = await find(mockParams);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: {
                email: mockParams.email,
            },
        });
        expect(result).toEqual(mockUser);
    });

    it('should return null if no user matches the email', async () => {
        const mockParams = { email: 'unknown@example.com' };

        systemUser.findOne.mockResolvedValue(null);

        const result = await find(mockParams);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: {
                email: mockParams.email,
            },
        });
        expect(result).toBeNull();
    });

    it('should throw an error if the database query fails', async () => {
        const mockParams = { email: 'error@example.com' };
        const mockError = new Error('Database error');

        systemUser.findOne.mockRejectedValue(mockError);

        await expect(find(mockParams)).rejects.toThrow('Database error');
        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: {
                email: mockParams.email,
            },
        });
    });
});
