const { assignAccessCode } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    update: jest.fn(),
}));

describe('access_codes - assignAccessCode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should assign an access code', async () => {
        access_codes.update.mockResolvedValue([1]);

        const data = { isAssigned: true, corporateUserId: 10 };
        const params = { keyId: 1 };

        const result = await assignAccessCode(data, params);

        expect(access_codes.update).toHaveBeenCalledWith(data, {
            where: { id: 1, isAssigned: false },
        });
        expect(result).toEqual([1]);
    });

    it('should return [0] when no unassigned code matches', async () => {
        access_codes.update.mockResolvedValue([0]);

        const result = await assignAccessCode({}, { keyId: 999 });

        expect(result).toEqual([0]);
    });
});
