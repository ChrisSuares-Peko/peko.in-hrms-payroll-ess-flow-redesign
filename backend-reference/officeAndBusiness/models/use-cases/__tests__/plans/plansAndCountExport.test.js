const { plansAndCountExport } = require('../../../use-cases/plans');
const plans = require('../../../entities/plans');
const {handleSortFields} = require('../../../../utils/sortHandle');

jest.mock('../../../entities/plans', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['id', 'ASC']]),
}));
jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn((date) => date.toISOString()),
    formatNumberWithLocalString: jest.fn((num) => num.toString()),
}));


describe('plansAndCountExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted plans data when called with valid parameters', async () => {
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
                    name: 'Premium Plan',
                    price: 200,
                    description: 'Test plan description',
                    highlights: 'Best features',
                    logo: 'https://example.com/logo.png',
                    status: 1,
                },
            ],
        };

        handleSortFields.mockReturnValue([['id', 'ASC']]);
        plans.findAndCountAll.mockResolvedValue(mockData);

        const result = await plansAndCountExport(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(plans.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.any(Object),
            order: [['id', 'ASC']],
            raw: true,
            nest: true,
        }));
        expect(result).toEqual([
            {
                Date: '2024-01-01T12:00:00.000Z',
                "Plan Name": 'Premium Plan',
                "Plan Price": '₹ 200',
                Description: 'Test plan description',
                Highlights: 'Best features',
                Logo: 'https://example.com/logo.png',
                Status: 'Active',
            },
        ]);
    });

    it('should return an empty array when no matching plans are found', async () => {
        const mockParams = { searchText: 'nonexistent', sort: 'DESC', sortField: 'name' };
        plans.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await plansAndCountExport(mockParams);

        expect(result).toEqual([]);
    });

    it('should throw an error when findAndCountAll fails', async () => {
        const mockParams = { searchText: 'error', sort: 'ASC', sortField: 'id' };
        const mockError = new Error('Database error');

        plans.findAndCountAll.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(plansAndCountExport(mockParams)).rejects.toEqual({ message: 'Something went wrong' });
        expect(console.log).toHaveBeenCalledWith(mockError);
    });
});
