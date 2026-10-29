const { fetchAllAccessCodes } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    findAll: jest.fn(),
}));

describe('access_codes - fetchAllAccessCodes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all access codes', async () => {
        const mockCodes = [
            { id: 1, access_code: 'CODE1' },
            { id: 2, access_code: 'CODE2' },
        ];
        access_codes.findAll.mockResolvedValue(mockCodes);

        const result = await fetchAllAccessCodes();

        expect(access_codes.findAll).toHaveBeenCalledWith({});
        expect(result).toEqual(mockCodes);
    });

    it('should return empty array when no codes exist', async () => {
        access_codes.findAll.mockResolvedValue([]);

        const result = await fetchAllAccessCodes();

        expect(result).toEqual([]);
    });
});
