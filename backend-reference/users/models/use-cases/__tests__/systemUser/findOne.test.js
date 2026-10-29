const { findOne } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));

describe('systemUser - findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a system user by credentialId', async () => {
        const mockUser = { id: 1, credentialId: 10, email: 'test@test.com' };
        systemUser.findOne.mockResolvedValue(mockUser);

        const result = await findOne({ id: 10 });

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: 10 },
        });
        expect(result).toEqual(mockUser);
    });

    it('should return null when no user found', async () => {
        systemUser.findOne.mockResolvedValue(null);

        const result = await findOne({ id: 999 });

        expect(result).toBeNull();
    });

    it('should handle errors', async () => {
        systemUser.findOne.mockRejectedValue(new Error('DB error'));

        await expect(findOne({ id: 1 })).rejects.toThrow('DB error');
    });
});
