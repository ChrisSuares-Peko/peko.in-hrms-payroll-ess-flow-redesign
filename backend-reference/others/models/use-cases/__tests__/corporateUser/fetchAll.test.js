const { fetchAll } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

// Mocking the models
jest.mock('../../../entities/access_codes', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/wallet', () => ({
    belongsTo: jest.fn(),
}))
jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}))
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}))
jest.mock('../../../entities/order', () => ({
    belongsTo: jest.fn(),
}))
jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn(),
}))
jest.mock('../../../../configs/database/index', () => ({
    define: jest.fn(),
    col: jest.fn((colName) => colName), // Mock sequelize.col
    literal: jest.fn((value) => value),
  }));
 
jest.mock('../../../entities/credential', () => ({
    findOne: jest.fn(),
}));

describe('fetchAll', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of corporate users matching the query and role', async () => {
        const mockQuery = 'John';
        const mockRole = 'admin';
        const mockRegisteredBy = 'admin123';
        const mockUsers = [
            {
                name: 'John Doe',
                id: 1,
                credentialId: 123,
                city: 'New York',
                mobileNo: '1234567890',
                credential: {
                    name: 'John',
                    username: 'johndoe',
                },
            },
        ];

        // Mock the findAll method to resolve with mock data
        corporateUser.findAll.mockResolvedValue(mockUsers);

        const result = await fetchAll(mockQuery, mockRole, mockRegisteredBy);

      expect(corporateUser.findAll).toHaveBeenCalledWith(
    expect.objectContaining({
        include: expect.arrayContaining([
            expect.objectContaining({
                model: credential,
                where: expect.objectContaining({
                    role: mockRole,
                    name: { [Op.ne]: null },
                    registeredBy: mockRegisteredBy,
                    [Op.or]: [
                        { name: { [Op.like]: `%${mockQuery}%` } },
                        { username: { [Op.like]: `%${mockQuery}%` } }
                    ],
                }),
                attributes: ['name', 'username'],
            }),
        ]),
        attributes: expect.arrayContaining([
            'name',
            'id',
            'credentialId',
            'city',
            'mobileNo',
            'email',
            ['corporateUser.registeredBy', 'registeredById'],
            expect.anything(), // registeredByName literal
        ]),
        raw: true,
        nest: true,
    })
);

        

        expect(result).toEqual(mockUsers);
    });

    it('should return a list of corporate users matching the query and role without registeredBy filter if not provided', async () => {
        const mockQuery = 'Alice';
        const mockRole = 'user';
        const mockUsers = [
            {
                name: 'Alice Smith',
                id: 2,
                credentialId: 124,
                city: 'Los Angeles',
                mobileNo: '9876543210',
                credential: {
                    name: 'Alice',
                    username: 'alicesmith',
                },
            },
        ];

        // Mock the findAll method to resolve with mock data
        corporateUser.findAll.mockResolvedValue(mockUsers);

        const result = await fetchAll(mockQuery, mockRole, null); // No registeredBy parameter

       expect(corporateUser.findAll).toHaveBeenCalledWith(
    expect.objectContaining({
        include: expect.arrayContaining([
            expect.objectContaining({
                model: credential,
                where: expect.objectContaining({
                    role: mockRole,
                    name: { [Op.ne]: null },
                    [Op.or]: [
                        { name: { [Op.like]: `%${mockQuery}%` } },
                        { username: { [Op.like]: `%${mockQuery}%` } }
                    ],
                }),
                attributes: ['name', 'username'],
            }),
        ]),
        attributes: expect.arrayContaining([
            'name',
            'id',
            'credentialId',
            'city',
            'mobileNo',
            'email',
            ['corporateUser.registeredBy', 'registeredById'],
            expect.anything(),
        ]),
        raw: true,
        nest: true,
    })
);

        expect(result).toEqual(mockUsers);
    });

   
});
