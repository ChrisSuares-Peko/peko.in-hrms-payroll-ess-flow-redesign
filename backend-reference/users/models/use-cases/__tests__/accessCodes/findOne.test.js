const { findOne } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    findOne: jest.fn(),
}));

describe('access_codes - findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find an unassigned active access code', async () => {
        const mockCode = { id: 1, access_code: 'TEST123', isAssigned: false, status: true };
        access_codes.findOne.mockResolvedValue(mockCode);

        const result = await findOne('TEST123');

        expect(access_codes.findOne).toHaveBeenCalledWith({
            where: { access_code: 'TEST123', isAssigned: false, status: true },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockCode);
    });

    it('should return null when no matching code found', async () => {
        access_codes.findOne.mockResolvedValue(null);

        const result = await findOne('INVALID');

        expect(result).toBeNull();
    });
});
