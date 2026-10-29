const { fetchAllWorks } = require('../../../use-cases/works');
const works = require('../../../entities/works');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/works', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['name', 'ASC']]),
}));

describe('fetchAllWorks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all works with filtering, sorting, and pagination', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            searchText: 'test',
            sort: 'ASC',
            limit: 10,
            offset: 0,
            sortField: 'name',
            partnerId: 5,
        };

        const mockResponse = { count: 2, rows: [{ id: 1, name: 'Test Work' }] };

        works.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await fetchAllWorks(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(works.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.any(Object),
            order: [['name', 'ASC']],
            limit: mockParams.limit,
            offset: mockParams.offset,
        }));
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty result when no matching works are found', async () => {
        const mockParams = { searchText: 'nonexistent', sort: 'DESC', sortField: 'description', limit: 5, offset: 0 };
        works.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await fetchAllWorks(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should handle cases where partnerId is default', async () => {
        const mockParams = { partnerId: 'default', sort: 'ASC', sortField: 'name' };
        const mockResponse = { count: 1, rows: [{ id: 2, name: 'Default Partner Work' }] };

        works.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await fetchAllWorks(mockParams);

        expect(works.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ credentialId: null }),
        }));
        expect(result).toEqual(mockResponse);
    });
});