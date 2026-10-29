const { findAllWorkspacesAndCount } = require('../../../use-cases/workspaces');
const workspaces = require('../../../entities/workspaces');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/workspaces', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['name', 'ASC']]), // Properly mocking the function
}));

describe('findAllWorkspacesAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated workspaces when called with valid parameters', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'name',
        };
        const mockData = { count: 2, rows: [{ id: 1, name: 'Test Workspace', monthlyPrice: '100' }] };

        workspaces.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAllWorkspacesAndCount(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(workspaces.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            include: expect.any(Array),
            where: expect.any(Object),
            limit: mockParams.limit,
            offset: mockParams.offset,
            order: [['name', 'ASC']],
        }));
        expect(result).toEqual(mockData);
    });

    it('should return an empty result when no matching workspaces are found', async () => {
        const mockParams = { limit: 10, offset: 0, searchText: 'nonexistent', sort: 'DESC', sortField: 'name' };
        workspaces.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllWorkspacesAndCount(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it("should handle errors gracefully and log them", async () => {
        const mockParams = { limit: 10, offset: 0, searchText: "error", sort: "ASC", sortField: "name" };
        const mockError = new Error("Database error");
    
        workspaces.findAndCountAll.mockRejectedValue(mockError);
    
        await expect(findAllWorkspacesAndCount(mockParams)).rejects.toEqual({ message: "Something went wrong" });
      });
});
