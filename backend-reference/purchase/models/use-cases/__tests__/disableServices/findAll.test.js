const { findAll } = require('../../../use-cases/disableService');
const disableService = require('../../../entities/disabledService');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

jest.mock('../../../entities/disabledService', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAll', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated list of disableService entries', async () => {
        const mockParams = { start: 0, length: 10, searchText: 'Test', order: 'ASC', column: 1 };
        const mockData = {
            count: 2,
            rows: [
                { id: 1, serviceProvider: 'Provider A', credentialId: 101, name: 'John Doe', serviceStatus: 'disabled' },
                { id: 2, serviceProvider: 'Provider B', credentialId: 102, name: 'Jane Doe', serviceStatus: 'active' },
            ],
        };

        disableService.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAll(mockParams);

        expect(disableService.findAndCountAll).toHaveBeenCalledWith({
            include: [
                { model: serviceOperator, as: '', attributes: ['serviceProvider'] },
                { model: credential, as: '', attributes: ['name'] },
            ],
            where: {
                [Op.or]: expect.any(Array),
            },
            order: [['serviceProvider', 'ASC']],
            limit: mockParams.length,
            offset: mockParams.start,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockData);
    });

    it('should return an empty result if no disableService entries match the search', async () => {
        const mockParams = { start: 0, length: 10, searchText: 'Invalid' };
        disableService.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAll(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should throw an error if database query fails', async () => {
        const mockParams = { start: 0, length: 10, searchText: 'Error' };
        const mockError = new Error('Database error');

        disableService.findAndCountAll.mockRejectedValue(mockError);

        await expect(findAll(mockParams)).rejects.toThrow('Database error');
    });
});
