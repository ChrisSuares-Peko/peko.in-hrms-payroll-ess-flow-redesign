const { updateAccessCode } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    update: jest.fn(),
}));

describe('access_codes - updateAccessCode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update an access code by id', async () => {
        access_codes.update.mockResolvedValue([1]);

        const result = await updateAccessCode({ id: 1 }, { status: false });

        expect(access_codes.update).toHaveBeenCalledWith({ status: false }, {
            where: { id: 1 },
        });
        expect(result).toEqual([1]);
    });

    it('should return [0] when no code matches', async () => {
        access_codes.update.mockResolvedValue([0]);

        const result = await updateAccessCode({ id: 999 }, { status: false });

        expect(result).toEqual([0]);
    });
});
