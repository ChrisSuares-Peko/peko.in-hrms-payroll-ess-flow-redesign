const { findAllAccessCodes } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    findAll: jest.fn(),
}));

describe('access_codes - findAllAccessCodes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active access codes', async () => {
        const mockCodes = [
            { id: 1, access_code: 'CODE1', status: true },
            { id: 2, access_code: 'CODE2', status: true },
        ];
        access_codes.findAll.mockResolvedValue(mockCodes);

        const result = await findAllAccessCodes();

        expect(access_codes.findAll).toHaveBeenCalledWith({
            where: { status: true },
        });
        expect(result).toEqual(mockCodes);
    });

    it('should return empty array when no codes exist', async () => {
        access_codes.findAll.mockResolvedValue([]);

        const result = await findAllAccessCodes();

        expect(result).toEqual([]);
    });
});
