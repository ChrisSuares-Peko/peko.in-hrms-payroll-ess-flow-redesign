const { transactionsAndCountExport } = require('../../../use-cases/disableService');
const disableService = require('../../../entities/disabledService');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const { handleSortFields } = require('../../../../utils/sortHandle');
const { Op } = require('sequelize')

jest.mock('../../../entities/disabledService', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
    belongsTo: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

describe('transactionsAndCountExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch transactions and format the data successfully', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'id',
        };

        const mockOrder = [['id', 'ASC']];
        handleSortFields.mockReturnValue(mockOrder);

        const mockData = {
            rows: [
                {
                    id: 1,
                    serviceOperator: { serviceProvider: 'Operator A' },
                    credential: { name: 'Corporate A', username: 'corpA' },
                    serviceStatus: true,
                },
                {
                    id: 2,
                    serviceOperator: { serviceProvider: 'Operator B' },
                    credential: { name: 'Corporate B', username: 'corpB' },
                    serviceStatus: false,
                },
            ],
            count: 2,
        };

        disableService.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionsAndCountExport(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith('id', 'ASC');
        expect(disableService.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: serviceOperator,
                    attributes: ['serviceProvider'],
                },
                {
                    model: credential,
                    attributes: ['name', 'username'],
                },
            ],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: '%test%' } },
                    { '$credential.name$': { [Op.like]: '%test%' } },
                    { '$credential.username$': { [Op.like]: '%test%' } }, // Add this line
                    { '$serviceOperator.serviceProvider$': { [Op.like]: '%test%' } },
                ],
            },
            
            order: mockOrder,
            raw: true,
            nest: true,
        });

        expect(result).toEqual([
            {
                'Service Operator': 'Operator A',
                'Corporate ID': 'corpA',
                'Corporate Name': 'Corporate A',
                Status: 'Active',
            },
            {
                'Service Operator': 'Operator B',
                'Corporate ID': 'corpB',
                'Corporate Name': 'Corporate B',
                Status: 'In Active',
            },
        ]);
    });

    it('should return an empty array if no data is found', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'id',
        };

        const mockOrder = [['id', 'ASC']];
        handleSortFields.mockReturnValue(mockOrder);

        disableService.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        const result = await transactionsAndCountExport(mockParams);

        expect(result).toEqual([]);
    });

    it('should throw an error if the query fails', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'id',
        };

        const mockError = new Error('Database error');
        disableService.findAndCountAll.mockRejectedValue(mockError);

        await expect(transactionsAndCountExport(mockParams)).rejects.toEqual({
            message: 'Something went wrong',
        });

        expect(disableService.findAndCountAll).toHaveBeenCalled();
    });
});
