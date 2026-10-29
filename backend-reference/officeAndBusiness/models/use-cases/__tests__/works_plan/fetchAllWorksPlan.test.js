const { fetchAllWorksPlan } = require('../../../use-cases/works_plan');
const work_plans = require('../../../entities/works_plan');
const { Op } = require('sequelize');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/works_plan', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));


describe('fetchAllWorksPlan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all works plans with sorting, filtering, and pagination', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            searchText: 'test',
            sort: 'ASC',
            sortField: 'name',
            limit: 10,
            offset: 0,
        };
        const mockResponse = { count: 2, rows: [
            { id: 1, name: 'Test Plan', description: 'Sample', createdAt: new Date() },
            { id: 2, name: 'Another Plan', description: 'Example', createdAt: new Date() },
        ]};

        handleSortFields.mockReturnValue([['name', 'ASC']]);
        work_plans.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await fetchAllWorksPlan(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(work_plans.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                include: expect.any(Array),
                where: expect.objectContaining({ [Op.or]: expect.any(Array) }),
                order: [['name', 'ASC']],
                limit: mockParams.limit,
                offset: mockParams.offset,
                raw: true,
                nest: true,
            })
        );
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty result when no matching work plans are found', async () => {
        const mockParams = { searchText: 'nonexistent', sort: 'DESC', sortField: 'price', limit: 10, offset: 0 };
        work_plans.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await fetchAllWorksPlan(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should return an empty result when no plans match the search criteria', async () => {
        const mockParams = { searchText: 'noMatch', sort: 'ASC', sortField: 'name', limit: 10, offset: 0 };
        const mockResponse = { count: 0, rows: [] };
    
        work_plans.findAndCountAll.mockResolvedValue(mockResponse);
    
        const result = await fetchAllWorksPlan(mockParams);
    
        expect(result).toEqual({ count: 0, rows: [] });
        expect(work_plans.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                include: expect.any(Array),
                where: expect.objectContaining({ [Op.or]: expect.any(Array) }),
                order: [['name', 'ASC']],
                limit: mockParams.limit,
                offset: mockParams.offset,
                raw: true,
                nest: true,
            })
        );
    });
    
});
