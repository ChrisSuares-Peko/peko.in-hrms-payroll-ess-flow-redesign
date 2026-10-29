const { connectionExcelCSVData } = require('../../peko_connect');
const connections = require('../../../entities/connections');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

jest.mock('../../../entities/connections');
jest.mock('../../../entities/credential');
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['createdAt', 'DESC']]),
}));
jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn(() => '2023-10-01 12:00:00'),
    capitalizeCase: jest.fn((val) => val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val),
}));

describe('connectionExcelCSVData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call connections.findAndCountAll with correct parameters and return formatted data', async () => {
        const from = '2023-10-01';
        const to = '2023-10-31';
        const params = {
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

        const mockData = {
            rows: [
                {
                    id: 1,
                    name: 'Corporate A',
                    email: 'test1@example.com',
                    mobile: '1234567890',
                    createdAt: '2023-10-01T12:00:00Z',
                    requirement: 'Requirement 1',
                    serviceProvider: 'Provider 1',
                    preferredMode: 'online',
                    credential: {
                        username: 'user1',
                        registeredByCredential: {
                            name: 'Partner A'
                        }
                    }
                },
                {
                    id: 2,
                    name: 'Corporate B',
                    email: 'test2@example.com',
                    mobile: '0987654321',
                    createdAt: '2023-10-02T12:00:00Z',
                    requirement: 'Requirement 2',
                    serviceProvider: 'Provider 2',
                    preferredMode: 'offline',
                    credential: {
                        username: 'user2',
                        registeredByCredential: {
                            name: 'Partner B'
                        }
                    }
                }
            ]
        };
        const expectedResult = [
            {
                "Request Date": '2023-10-01 12:00:00',
                "Request ID": 1,
                "Corporate ID": 'user1',
                "Corporate Name": 'Corporate A',
                "Partner Name": 'Partner A',
                "Mobile Number": '1234567890',
                "Email ID": 'test1@example.com',
                "Preferred Mode": 'Online',
                Requirements: 'Requirement 1',
                "Service Provider": 'Provider 1'
            },
            {
                "Request Date": '2023-10-01 12:00:00',
                "Request ID": 2,
                "Corporate ID": 'user2',
                "Corporate Name": 'Corporate B',
                "Partner Name": 'Partner B',
                "Mobile Number": '0987654321',
                "Email ID": 'test2@example.com',
                "Preferred Mode": 'Offline',
                Requirements: 'Requirement 2',
                "Service Provider": 'Provider 2'
            }
        ];

        connections.findAndCountAll.mockResolvedValue(mockData);

        const result = await connectionExcelCSVData(params);

        expect(connections.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    attributes: ["username"],
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
            raw: true,
            nest: true
        });
        expect(result).toEqual(expectedResult);
    });

    it('should handle missing data and return default values', async () => {
        const from = '2023-10-01';
        const to = '2023-10-31';
        const params = {
            sort: 'DESC',
            searchText: 'test',
            sortField: 'createdAt',
            registeredBy: 1,
            from,
            to,
        };
        const mockData = {
            rows: [
                {
                    id: null,
                    name: null,
                    email: null,
                    mobile: null,
                    createdAt: null,
                    requirement: null,
                    serviceProvider: null,
                    preferredMode: null,
                    credential: {
                        username: null,
                        registeredByCredential: {
                            name: null
                        }
                    }
                }
            ]
        };
        const expectedResult = [
            {
                "Request Date": 'Not Available',
                "Request ID": 'Not Available',
                "Corporate ID": 'Not Available',
                "Corporate Name": 'Not Available',
                "Partner Name": 'Not Available',
                "Mobile Number": 'Not Available',
                "Email ID": 'Not Available',
                "Preferred Mode": 'Not Available',
                Requirements: 'Not Available',
                "Service Provider": 'Not Available'
            }
        ];

        connections.findAndCountAll.mockResolvedValue(mockData);

        const result = await connectionExcelCSVData(params);

        expect(result).toEqual(expectedResult);
    });

    it('should handle errors and throw a custom error message', async () => {
        const params = {
            sort: 'DESC',
            searchText: 'test',
            sortField: 'createdAt',
            registeredBy: 1,
            from: '2023-10-01',
            to: '2023-10-31',
        };
        const error = new Error('Database query failed');

        connections.findAndCountAll.mockRejectedValue(error);

        await expect(connectionExcelCSVData(params)).rejects.toEqual({ message: 'Something went wrong' });
    });
});
