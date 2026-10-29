const { findAllPeko } = require('../../../use-cases/peko_connect');
const peko_connect = require('../../../entities/peko_connect');
const {handleSortFields} = require('../../../../utils/sortHandle');
const { Op } = require('sequelize');

jest.mock('../../../entities/peko_connect', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['id', 'ASC']]),
}));

describe('findAllPeko', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated peko_connect records', async () => {
        const mockParams = {
            page: 1, // ✅ Matches expected param
            itemsPerPage: 10, // ✅ Matches expected param
            searchText: 'test',
            sort: 'ASC',
            sortField: 'id',
          };
          
          
        const mockData = {
            count: 2,
            rows: [
                { id: 1, serviceProvider: 'Provider A', category: 'Tech', description: 'Test service', address: '123 Street' },
                { id: 2, serviceProvider: 'Provider B', category: 'Finance', description: 'Another service', address: '456 Avenue' },
            ],
        };

        handleSortFields.mockReturnValue([['id', 'ASC']]);
        peko_connect.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAllPeko(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(peko_connect.findAndCountAll).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { id: { [Op.like]: `%test%` } },
                    { serviceProvider: { [Op.like]: `%test%` } },
                    { address: { [Op.like]: `%test%` } },
                    { category: { [Op.like]: `%test%` } },
                ],
            },
            order: [['id', 'ASC']],
            limit: mockParams.itemsPerPage, // ✅ Use the correct param
            offset: (mockParams.page - 1) * mockParams.itemsPerPage, // ✅ Correct offset calculation
            raw: true,
          });
          
        expect(result).toEqual(mockData);
    });

    it('should return an empty result when no matching records are found', async () => {
        const mockParams = { start: 0, length: 10, searchText: 'nonexistent', sort: 'DESC', sortField: 'serviceProvider' };
        peko_connect.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllPeko(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    
});
