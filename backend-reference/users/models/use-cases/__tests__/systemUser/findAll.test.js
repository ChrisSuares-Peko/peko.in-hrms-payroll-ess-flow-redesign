const { findAll } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser', () => ({
    findAll: jest.fn(),
}));

describe('systemUser - findAll', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find all system users by id', async () => {
        const mockUsers = [{ id: 1, email: 'test@test.com' }];
        systemUser.findAll.mockResolvedValue(mockUsers);

        const result = await findAll({ id: 1 });

        expect(systemUser.findAll).toHaveBeenCalledWith({
            where: { id: 1 },
        });
        expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users found', async () => {
        systemUser.findAll.mockResolvedValue([]);

        const result = await findAll({ id: 999 });

        expect(result).toEqual([]);
    });
});
