const { pekoAndCountExport } = require('../../../use-cases/peko_connect');
const peko_connect = require('../../../entities/peko_connect');
const {handleSortFields} = require('../../../../utils/sortHandle');

jest.mock('../../../entities/peko_connect', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['id', 'ASC']]),
}));

jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn((date) => date.toISOString()), // Properly mock the named export
}));


describe('pekoAndCountExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted peko_connect data when called with valid parameters', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'id',
        };
        const mockData = {
            count: 2,
            rows: [
                {
                    createdAt: new Date('2024-01-01T12:00:00Z'),
                    serviceProvider: 'Provider A',
                    address: '123 Street',
                    category: 'Technology',
                    description: 'Test description',
                    status: 1,
                },
            ],
        };

        handleSortFields.mockReturnValue([['id', 'ASC']]);
        peko_connect.findAndCountAll.mockResolvedValue(mockData);

        const result = await pekoAndCountExport(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(peko_connect.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.any(Object),
            order: [['id', 'ASC']],
            raw: true,
        }));
        expect(result).toEqual([
            {
                Date: '2024-01-01T12:00:00.000Z',
                "Service Provider": 'Provider A',
                Address: '123 Street',
                Category: 'Technology',
                Description: 'Test description',
                Status: 'Active',
            },
        ]);
    });

    it('should return an empty array when no matching records are found', async () => {
        const mockParams = { searchText: 'nonexistent', sort: 'DESC', sortField: 'serviceProvider' };
        peko_connect.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await pekoAndCountExport(mockParams);

        expect(result).toEqual([]);
    });

    it('should throw an error when findAndCountAll fails', async () => {
        const mockParams = { searchText: 'error', sort: 'ASC', sortField: 'id' };
        const mockError = new Error('Database error');

        peko_connect.findAndCountAll.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(pekoAndCountExport(mockParams)).rejects.toEqual({ message: 'Something went wrong' });
        expect(console.log).toHaveBeenCalledWith(mockError);
    });
});
