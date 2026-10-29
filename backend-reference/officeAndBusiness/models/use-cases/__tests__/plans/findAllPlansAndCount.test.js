const { findAllPlansAndCount } = require('../../../use-cases/plans');
const plans = require('../../../entities/plans');
const {handleSortFields} = require('../../../../utils/sortHandle');

jest.mock('../../../entities/plans', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['id', 'ASC']]),
}));

describe('findAllPlansAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated plans with count', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'id',
        };
        const mockData = {
            count: 2,
            rows: [
                { id: 1, name: 'Plan A', price: 100, description: 'Test Plan', highlights: 'Feature A', billingCycle: 'Monthly' },
                { id: 2, name: 'Plan B', price: 200, description: 'Another Plan', highlights: 'Feature B', billingCycle: 'Yearly' },
            ],
        };

        handleSortFields.mockReturnValue([['id', 'ASC']]);
        plans.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAllPlansAndCount(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(plans.findAndCountAll).toHaveBeenCalledWith({
            where: expect.any(Object),
            order: [['id', 'ASC']],
            limit: mockParams.limit,
            offset: mockParams.offset,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockData);
    });

    it('should return an empty result when no matching plans are found', async () => {
        const mockParams = { limit: 10, offset: 0, searchText: 'nonexistent', sort: 'DESC', sortField: 'name' };
        plans.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllPlansAndCount(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should return an empty result when no params are provided', async () => {
        const mockParams = {};
        const mockData = {
            count: 0,
            rows: [],
        };
    
        plans.findAndCountAll.mockResolvedValue(mockData);
    
        const result = await findAllPlansAndCount(mockParams);
    
        expect(result).toEqual(mockData);
    });
    
    
});
