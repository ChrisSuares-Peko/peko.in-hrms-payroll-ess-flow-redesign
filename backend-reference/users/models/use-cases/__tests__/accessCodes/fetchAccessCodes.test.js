const { fetchAccessCodes } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    findAll: jest.fn(),
}));

describe('access_codes - fetchAccessCodes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch active access codes matching query', async () => {
        const mockCodes = [{ id: 1, access_code: 'TEST123' }];
        access_codes.findAll.mockResolvedValue(mockCodes);

        const result = await fetchAccessCodes('TEST');

        expect(access_codes.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockCodes);
    });

    it('should return empty array when no codes match', async () => {
        access_codes.findAll.mockResolvedValue([]);

        const result = await fetchAccessCodes('NOMATCH');

        expect(result).toEqual([]);
    });
});
