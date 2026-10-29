const { findAllAccessCodesAndCount } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    findAndCountAll: jest.fn(),
}));

describe('access_codes - findAllAccessCodesAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated access codes with count', async () => {
        const mockResult = {
            rows: [{ id: 1, access_code: 'CODE1' }],
            count: 1,
        };
        access_codes.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllAccessCodesAndCount({
            start: 0,
            length: 10,
            searchText: '',
            order: 'DESC',
            column: 0,
        });

        expect(access_codes.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('should use default column when invalid column index provided', async () => {
        const mockResult = { rows: [], count: 0 };
        access_codes.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllAccessCodesAndCount({
            start: 0,
            length: 10,
            searchText: 'test',
            order: 'ASC',
            column: 99,
        });

        expect(result).toEqual(mockResult);
    });
});
