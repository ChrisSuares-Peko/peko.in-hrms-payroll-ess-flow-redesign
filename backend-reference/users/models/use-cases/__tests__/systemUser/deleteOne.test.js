const { deleteOne } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser', () => ({
    destroy: jest.fn(),
}));

describe('systemUser - deleteOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a system user by id', async () => {
        systemUser.destroy.mockResolvedValue(1);

        const result = await deleteOne({ id: 1 });

        expect(systemUser.destroy).toHaveBeenCalledWith({
            where: { id: 1 },
        });
        expect(result).toBe(1);
    });

    it('should return 0 when no user matches', async () => {
        systemUser.destroy.mockResolvedValue(0);

        const result = await deleteOne({ id: 999 });

        expect(result).toBe(0);
    });
});
