const { worksExport } = require('../../../use-cases/works');
const works = require('../../../entities/works');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/works', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['name', 'ASC']]),
}));

describe('worksExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted works data when called with valid parameters', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            searchText: 'test',
            sort: 'ASC',
            sortField: 'name',
        };
        const mockData = {
            count: 2,
            rows: [
                {
                    createdAt: new Date('2024-01-01T12:00:00Z'),
                    name: 'Test Work',
                    contactName: 'John Doe',
                    // features: 'Feature A, Feature B',
                    // description: 'Test description',
                    status: 1,
                },
            ],
        };

        handleSortFields.mockReturnValue([['name', 'ASC']]);
        works.findAndCountAll.mockResolvedValue(mockData);

        const result = await worksExport(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(works.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.any(Object),
            order: [['name', 'ASC']],
            raw: true,
            nest: true,
        }));
        expect(result).toEqual([
            {
                Date: 'January 1, 2024 at 12:00 PM',
                "Work Name": 'Test Work',
                "POC Name": 'John Doe',
                // Features: 'Feature A, Feature B',
                // Description: 'Test description',
                Status: 'Active',
            },
        ]);
    });

    it('should return an empty array when no matching works are found', async () => {
        const mockParams = { searchText: 'nonexistent', sort: 'DESC', sortField: 'name' };
        works.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await worksExport(mockParams);

        expect(result).toEqual([]);
    });
});
