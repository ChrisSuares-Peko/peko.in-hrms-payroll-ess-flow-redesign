const { find } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));

describe('systemUser - find', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a system user by email', async () => {
        const mockUser = { id: 1, email: 'test@test.com' };
        systemUser.findOne.mockResolvedValue(mockUser);

        const result = await find({ email: 'test@test.com' });

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { email: 'test@test.com' },
        });
        expect(result).toEqual(mockUser);
    });

    it('should return null when no user found', async () => {
        systemUser.findOne.mockResolvedValue(null);

        const result = await find({ email: 'notfound@test.com' });

        expect(result).toBeNull();
    });
});
