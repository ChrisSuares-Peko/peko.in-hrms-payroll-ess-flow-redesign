const { findAllAndCount } = require('../../systemUser'); // Adjust the path as needed
const systemUser = require('../../../entities/systemUser');
const credential = require('../../../entities/credential');
const roleAndPermissions = require('../../../entities/roleAndPermissions');
const wallet = require('../../../entities/wallet');
const { Op } = require("sequelize");

jest.mock('../../../entities/systemUser', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/roleAndPermissions', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/wallet', () => ({
    findAll: jest.fn(),
}));

describe('findAllAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return users with wallet balance and count', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'id',
            userId: 1,
        };

        const mockSystemUsers = {
            rows: [
                { id: 1, credentialId: 1, email: 'test1@example.com', credential: { username: 'test1', role: 'admin', name: 'User1' } },
                { id: 2, credentialId: 2, email: 'test2@example.com', credential: { username: 'test2', role: 'user', name: 'User2' } },
            ],
            count: 2,
        };

        const mockWalletData = [
            { credentialId: 1, balance: 100 },
            { credentialId: 2, balance: 200 },
        ];

        systemUser.findAndCountAll.mockResolvedValue(mockSystemUsers);
        wallet.findAll.mockResolvedValue(mockWalletData);

        const result = await findAllAndCount(mockParams);

        expect(systemUser.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    where: { id: { [Op.ne]: mockParams.userId } },
                    attributes: [
                        'username',
                        'role',
                        'name',
                        'createdAt',
                        'passwordProtection', // Add this
                        'partnerId', // Add this
                    ],
                },
                {
                    model: roleAndPermissions,
                    attributes: ['roleName'],
                },
            ],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: `%${mockParams.searchText}%` } },
                    { email: { [Op.like]: `%${mockParams.searchText}%` } },
                    { '$credential.username$': { [Op.like]: `%${mockParams.searchText}%` } },
                    { '$credential.name$': { [Op.like]: `%${mockParams.searchText}%` } },
                    { '$credential.role$': { [Op.like]: `%${mockParams.searchText}%` } },
                ],
                '$userType$': undefined, // Add this if needed
            },
            order: [[mockParams.sortField, mockParams.sort]],
            limit: mockParams.limit,
            offset: mockParams.offset,
            raw: true,
            nest: true,
        });
        

        expect(wallet.findAll).toHaveBeenCalledWith({
            where: {
                credentialId: {
                    [Op.in]: [1, 2],
                },
            },
            raw: true,
        });

        expect(result.rows[0].balance).toEqual(100);
        expect(result.rows[1].balance).toEqual(200);
        expect(result.count).toEqual(2);
    });

    it('should return an empty result if no users are found', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            searchText: 'nonexistent',
            sort: 'ASC',
            sortField: 'id',
            userId: 1,
        };

        const mockSystemUsers = { rows: [], count: 0 };

        systemUser.findAndCountAll.mockResolvedValue(mockSystemUsers);
        wallet.findAll.mockResolvedValue([]);

        const result = await findAllAndCount(mockParams);

        expect(systemUser.findAndCountAll).toHaveBeenCalled();
        expect(wallet.findAll).toHaveBeenCalled();
        expect(result.rows).toEqual([]);
        expect(result.count).toEqual(0);
    });

    it('should handle errors and throw an exception', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'id',
            userId: 1,
        };

        const mockError = new Error('Database error');

        systemUser.findAndCountAll.mockRejectedValue(mockError);

        await expect(findAllAndCount(mockParams)).rejects.toThrow('Database error');
        expect(systemUser.findAndCountAll).toHaveBeenCalled();
        expect(wallet.findAll).not.toHaveBeenCalled();
    });
});
