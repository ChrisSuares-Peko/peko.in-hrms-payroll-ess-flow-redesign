const { findDuplicate } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    findOne: jest.fn(),
}));

describe('access_codes - findDuplicate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a duplicate access code', async () => {
        const mockCode = { id: 1, access_code: 'DUP123' };
        access_codes.findOne.mockResolvedValue(mockCode);

        const result = await findDuplicate('DUP123');

        expect(access_codes.findOne).toHaveBeenCalledWith({
            where: { access_code: 'DUP123' },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockCode);
    });

    it('should return null when no duplicate found', async () => {
        access_codes.findOne.mockResolvedValue(null);

        const result = await findDuplicate('UNIQUE');

        expect(result).toBeNull();
    });
});
