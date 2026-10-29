const { findOneSystemUser } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));

describe('systemUser - findOneSystemUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a system user by credentialId with attributes', async () => {
        const mockUser = { email: 'test@test.com' };
        systemUser.findOne.mockResolvedValue(mockUser);

        const result = await findOneSystemUser({ id: 10 }, ['email']);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: 10 },
            attributes: ['email'],
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockUser);
    });

    it('should use undefined attributes by default', async () => {
        systemUser.findOne.mockResolvedValue({ id: 1 });

        await findOneSystemUser({ id: 10 });

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: 10 },
            attributes: undefined,
            nest: true,
            raw: true,
        });
    });

    it('should return null when no user found', async () => {
        systemUser.findOne.mockResolvedValue(null);

        const result = await findOneSystemUser({ id: 999 });

        expect(result).toBeNull();
    });

    it('should handle errors', async () => {
        systemUser.findOne.mockRejectedValue(new Error('DB error'));

        await expect(findOneSystemUser({ id: 1 })).rejects.toThrow('DB error');
    });
});
