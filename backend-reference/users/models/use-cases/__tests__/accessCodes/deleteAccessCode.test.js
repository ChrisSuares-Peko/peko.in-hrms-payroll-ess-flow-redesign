const { deleteAccessCode } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    destroy: jest.fn(),
}));

describe('access_codes - deleteAccessCode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete an access code by id', async () => {
        access_codes.destroy.mockResolvedValue(1);

        const result = await deleteAccessCode({ id: 1 });

        expect(access_codes.destroy).toHaveBeenCalledWith({
            where: { id: 1 },
        });
        expect(result).toBe(1);
    });

    it('should return 0 when no code matches', async () => {
        access_codes.destroy.mockResolvedValue(0);

        const result = await deleteAccessCode({ id: 999 });

        expect(result).toBe(0);
    });
});
