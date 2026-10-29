const { findAllConnections } = require('../../peko_connect');
const connections = require('../../../entities/connections');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

jest.mock('../../../entities/connections');
jest.mock('../../../entities/credential');
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['createdAt', 'DESC']])
}));

describe('findAllConnections', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call connections.findAndCountAll with correct parameters and return the result', async () => {
        const from = '2023-10-01';
        const to = '2023-10-31';
        const params = {
            limit: 10,
            offset: 0,
            sort: 'DESC',
            searchText: 'test',
            sortField: 'createdAt',
            registeredBy: 1,
            from,
            to,
        };

        const tomorrow = new Date(to);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const mockResult = {
            count: 2,
            rows: [
                {
                    id: 1,
                    name: 'Connection 1',
                    email: 'test1@example.com',
                    mobile: '1234567890',
                    createdAt: '2023-10-01T12:00:00Z',
                    requirement: 'Requirement 1',
                    serviceProvider: 'Provider 1',
                    credential: {
                        username: 'user1',
                        registeredByCredential: {
                            name: 'Registered By User 1'
                        }
                    }
                },
            ]
        };

        connections.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllConnections(params);

        expect(connections.findAndCountAll).toHaveBeenCalledWith({
            attributes: ['id', 'name', 'email', 'mobile', 'createdAt', 'requirement', 'serviceProvider', 'preferredMode'],
            include: [
                {
                    model: credential,
                    attributes: ["username", 'registeredBy'],
                    where: { registeredBy: params.registeredBy },
                    include: [
                        {
                            model: credential,
                            as: 'registeredByCredential',
                            attributes: ['name']
                        }
                    ]
                }
            ],
            where: {
                createdAt: {
                    [Op.between]: [from, tomorrow]
                },
                [Op.or]: [
                    { id: { [Op.like]: '%test%' } },
                    { name: { [Op.like]: '%test%' } },
                    { mobile: { [Op.like]: '%test%' } },
                    { email: { [Op.like]: '%test%' } },
                    { requirement: { [Op.like]: '%test%' } },
                    { serviceProvider: { [Op.like]: '%test%' } },
                    { '$credential.username$': { [Op.like]: '%test%' } }
                ]
            },
            order: [['createdAt', 'DESC']],
            limit: params.limit,
            offset: params.offset,
            raw: true,
            nest: true
        });
        expect(result).toEqual(mockResult);
    });

    it('should handle errors and throw a custom error message', async () => {
        const params = {
            limit: 10,
            offset: 0,
            sort: 'DESC',
            searchText: 'test',
            sortField: 'createdAt',
            registeredBy: 1,
            from: '2023-10-01',
            to: '2023-10-31',
        };
        const error = new Error('Database query failed');

        connections.findAndCountAll.mockRejectedValue(error);

        await expect(findAllConnections(params)).rejects.toEqual({ message: 'Something went wrong' });
    });
});
