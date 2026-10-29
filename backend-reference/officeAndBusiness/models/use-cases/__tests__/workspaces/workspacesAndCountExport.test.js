const { workspacesAndCountExport } = require('../../../use-cases/workspaces');
const workspaces = require('../../../entities/workspaces');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/workspaces', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['name', 'ASC']]), // Mock sorting function
}));

jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn((date) => date.toISOString()), // Mock date formatting
    formatNumberWithLocalString: jest.fn((num) => num.toString()), // Mock number formatting
}));

describe('workspacesAndCountExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted workspace data when called with valid parameters', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'name',
        };
        const mockData = {
            count: 2,
            rows: [
                {
                    createdAt: new Date('2024-01-01T12:00:00Z'),
                    name: 'Test Workspace',
                    monthlyPrice: 5000,
                    yearlyPrice: 50000,
                    address: '123 Street, City',
                    latLng: '28.6139, 77.2090',
                    status: 1,
                },
            ],
        };

        workspaces.findAndCountAll.mockResolvedValue(mockData);

        const result = await workspacesAndCountExport(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(workspaces.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            include: expect.any(Array),
            where: expect.any(Object),
        }));

        expect(result).toEqual([
            {
                Date: '2024-01-01T12:00:00.000Z',
                "Workspace Name": 'Test Workspace',
                "Monthly Price": '₹ 5000',
                "Yearly Price": '₹ 50000',
                "Workspace Address": '123 Street, City',
                "Lat/Long": '28.6139, 77.2090',
                Status: 'Active',
            },
        ]);
    });

    it('should return an empty array when no matching workspaces are found', async () => {
        const mockParams = { searchText: 'nonexistent', sort: 'DESC', sortField: 'name' };
        workspaces.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await workspacesAndCountExport(mockParams);

        expect(result).toEqual([]);
    });

    it('should handle errors gracefully and log them', async () => {
        const mockParams = { searchText: 'error', sort: 'ASC', sortField: 'name' };
        const mockError = new Error('Database error');

        workspaces.findAndCountAll.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(workspacesAndCountExport(mockParams)).rejects.toEqual({ message: 'Something went wrong' });
        expect(console.log).toHaveBeenCalledWith(mockError);
    });
});
