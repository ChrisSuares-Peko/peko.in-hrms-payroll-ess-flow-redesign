const { findLastFiveTransactions } = require('../../../use-cases/serviceOperator');
const sequelizeConfig = require('../../../../configs/database/index');

jest.mock('../../../../configs/database/index', () => ({
    query: jest.fn(),
    QueryTypes: { SELECT: 'SELECT' },
    define:jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));
describe('findLastFiveTransactions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the last five transactions for a given user', async () => {
        const mockParams = {
            userId: 1,
            length: 5,
            serviceProvider: 'TestProvider',
            status: ['Completed', 'Pending'],
            orderCol: 'createdAt',
            order: 'DESC'
        };
        const mockResults = [
            { id: 1, credentialId: 1, serviceProvider: 'TestProvider', status: 'Completed' },
            { id: 2, credentialId: 1, serviceProvider: 'TestProvider', status: 'Pending' }
        ];

        sequelizeConfig.query.mockResolvedValue(mockResults);

        const result = await findLastFiveTransactions(mockParams);

        expect(sequelizeConfig.query).toHaveBeenCalledWith(expect.stringContaining('SELECT *,'), {
            type: sequelizeConfig.QueryTypes.SELECT,
            replacements: expect.objectContaining({
                userId: mockParams.userId,
                length: mockParams.length,
                serviceProvider: mockParams.serviceProvider,
                status: mockParams.status,
            }),
        });
        expect(result).toEqual(mockResults);
    });

    it('should return an empty array if no transactions are found', async () => {
        const mockParams = {
            userId: 1,
            length: 5,
            serviceProvider: 'TestProvider',
            status: ['Completed', 'Pending'],
            orderCol: 'createdAt',
            order: 'DESC'
        };
        sequelizeConfig.query.mockResolvedValue([]);

        const result = await findLastFiveTransactions(mockParams);

        expect(result).toEqual([]);
    });

    it('should handle errors if database query fails', async () => {
        const mockParams = {
            userId: 1,
            length: 5,
            serviceProvider: 'TestProvider',
            status: ['Completed', 'Pending'],
            orderCol: 'createdAt',
            order: 'DESC'
        };
        const mockError = new Error('Database error');

        sequelizeConfig.query.mockRejectedValue(mockError);

        await expect(findLastFiveTransactions(mockParams)).rejects.toThrow('Database error');
    });
});
