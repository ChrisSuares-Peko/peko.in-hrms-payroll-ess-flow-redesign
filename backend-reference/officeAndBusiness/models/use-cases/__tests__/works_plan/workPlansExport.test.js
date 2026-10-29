const { workPlansExport } = require('../../../use-cases/works_plan');
const work_plans = require('../../../entities/works_plan');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/works_plan', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn((date) => date.toISOString()),
    formatNumberWithLocalString: jest.fn((num) => num.toString()),
}));

describe('workPlansExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted work plans data when called with valid parameters', async () => {
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
                    name: 'Test Plan',
                    price: 200,
                    billingCycle: 'Monthly',
                    status: 1,
                    work: { name: 'Sample Work' },
                },
            ],
        };

        handleSortFields.mockReturnValue([['name', 'ASC']]);
        work_plans.findAndCountAll.mockResolvedValue(mockData);

        const result = await workPlansExport(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(work_plans.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.any(Object),
            order: [['name', 'ASC']],
            raw: true,
            nest: true,
        }));
        expect(result).toEqual([
            {
                Date: '2024-01-01T12:00:00.000Z',
                "Plan Name": 'Test Plan',
                "Work Name": 'Sample Work',
                "Partner Name": 'Default',
                Price: 'AED 200',
                Status: 'Active',
            },
        ]);
    });

    it('should return an empty array when no matching work plans are found', async () => {
        const mockParams = { searchText: 'nonexistent', sort: 'DESC', sortField: 'price' };
        work_plans.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await workPlansExport(mockParams);

        expect(result).toEqual([]);
    });

    it('should return empty array when no data is found', async () => {
        const mockParams = { searchText: 'nonexistent', sort: 'DESC', sortField: 'price' };
        
        // Mock the response when no data matches
        work_plans.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    
        const result = await workPlansExport(mockParams);
    
        // Expect the result to be an empty array
        expect(result).toEqual([]);
    });
    
});
