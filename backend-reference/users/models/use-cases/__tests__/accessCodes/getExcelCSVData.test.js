const { getExcelCSVData } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    findAll: jest.fn(),
}));

describe('access_codes - getExcelCSVData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted CSV data', async () => {
        access_codes.findAll.mockResolvedValue([
            { id: 1, access_code: 'CODE1' },
            { id: 2, access_code: null },
        ]);

        const result = await getExcelCSVData();

        expect(result).toEqual([
            { 'ID': 1, 'Access Code': 'CODE1' },
            { 'ID': 2, 'Access Code': 'Not Available' },
        ]);
    });

    it('should return empty array when no codes exist', async () => {
        access_codes.findAll.mockResolvedValue([]);

        const result = await getExcelCSVData();

        expect(result).toEqual([]);
    });
});
