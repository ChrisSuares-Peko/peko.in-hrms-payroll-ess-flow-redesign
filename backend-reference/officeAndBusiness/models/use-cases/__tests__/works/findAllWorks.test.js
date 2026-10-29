const { findAllWorks } = require('../../../use-cases/works');
const works = require('../../../entities/works');

jest.mock('../../../entities/works', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllWorks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated works with sorting', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            sort: 'ASC',
            filter: 'name',
        };
        const mockResponse = { count: 2, rows: [
            { id: 1, name: 'Work A', status: true },
            { id: 2, name: 'Work B', status: true },
        ]};

        works.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllWorks(mockParams);

        expect(works.findAndCountAll).toHaveBeenCalledWith({
            where: { status: true },
            order: [['name', 'ASC']],
            limit: mockParams.limit,
            offset: mockParams.offset,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty result when no works are found', async () => {
        const mockParams = { limit: 10, offset: 0, sort: 'DESC', filter: 'name' };
        works.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllWorks(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should return an empty result when no parameters are provided', async () => {
        const mockParams = {};
        const mockResponse = { count: 0, rows: [] };
    
        works.findAndCountAll.mockResolvedValue(mockResponse);
    
        const result = await findAllWorks(mockParams);
    
        expect(result).toEqual(mockResponse);
    });
    
});
