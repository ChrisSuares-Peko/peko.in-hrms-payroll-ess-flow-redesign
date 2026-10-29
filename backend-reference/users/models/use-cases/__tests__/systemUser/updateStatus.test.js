const { updateStatus } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser', () => ({
    update: jest.fn(),
}));

describe('systemUser - updateStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update system user status', async () => {
        systemUser.update.mockResolvedValue([1]);

        const req = { params: { id: 1 }, body: { isActive: true } };
        const result = await updateStatus(req, {}, jest.fn());

        expect(systemUser.update).toHaveBeenCalledWith(
            { isActive: true },
            { where: { id: 1 } }
        );
        expect(result).toEqual([1]);
    });

    it('should return undefined when update fails silently', async () => {
        systemUser.update.mockResolvedValue([0]);

        const req = { params: { id: 999 }, body: { isActive: false } };
        const result = await updateStatus(req, {}, jest.fn());

        expect(result).toEqual([0]);
    });
});
