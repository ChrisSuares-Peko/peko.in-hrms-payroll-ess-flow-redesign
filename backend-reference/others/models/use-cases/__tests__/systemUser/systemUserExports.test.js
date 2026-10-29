const { systemUserExports } = require('../../systemUser');
const systemUser = require('../../../entities/systemUser');
const credential = require('../../../entities/credential');
const roleAndPermissions = require('../../../entities/roleAndPermissions');
const wallet = require('../../../entities/wallet');
const { Op } = require('sequelize');
const { formattedDateTime } = require('../../../../utils/formatter');

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

describe('systemUserExports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted system user data for export', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'id',
            userId: 1,
        };

        const mockSystemUsers = {
            rows: [
                {
                    id: 1,
                    credentialId: 1,
                    email: 'test1@example.com',
                    mobileNo: '1234567890',
                    portalUrl: 'https://portal.example.com',
                    createdAt: new Date(),
                    credential: { username: 'test1', role: 'admin', name: 'User1' },
                    roleAndPermission: { roleName: 'Admin' },
                },
                {
                    id: 2,
                    credentialId: 2,
                    email: 'test2@example.com',
                    mobileNo: '9876543210',
                    portalUrl: 'https://portal.example2.com',
                    createdAt: new Date(),
                    credential: { username: 'test2', role: 'user', name: 'User2' },
                    roleAndPermission: { roleName: 'User' },
                },
            ],
            count: 2,
        };

        const mockWalletData = [
            { credentialId: 1, balance: 100 },
            { credentialId: 2, balance: 200 },
        ];

        systemUser.findAndCountAll.mockResolvedValue(mockSystemUsers);
        wallet.findAll.mockResolvedValue(mockWalletData);

        const result = await systemUserExports(mockParams);

        expect(systemUser.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    where: { id: { [Op.ne]: mockParams.userId } },
                    attributes: ['username', 'role', 'name', 'createdAt','passwordProtection', 'partnerId'],
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
            },
            order: [[mockParams.sortField, mockParams.sort]],
            raw: true,
            nest: true,
        });

        expect(wallet.findAll).toHaveBeenCalledWith({
            where: {
                credentialId: { [Op.in]: [1, 2] },
            },
            raw: true,
        });

        const expectedResult = mockSystemUsers.rows.map((row) => ({
            Date: row.createdAt ? formattedDateTime(row.createdAt) : 'Not Available',
            Username: row.credential?.username || 'Not Available',
            Role: row.roleAndPermission?.roleName || 'Not Available',
            'Mobile No': row.mobileNo || 'Not Available',
            'Portal Url': row.portalUrl || 'Not Available',
            'Email ID': row.email || 'Not Available',
            Status: row.isActive > 0 ? 'Active' : 'In Active',
        }));

        expect(result).toEqual(expectedResult);
    });

    it('should return an empty array if no system users are found', async () => {
        const mockParams = {
            searchText: 'nonexistent',
            sort: 'ASC',
            sortField: 'id',
            userId: 1,
        };

        systemUser.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        wallet.findAll.mockResolvedValue([]);

        const result = await systemUserExports(mockParams);

        expect(systemUser.findAndCountAll).toHaveBeenCalled();
        expect(wallet.findAll).toHaveBeenCalled();
        expect(result).toEqual([]);
    });

   
});
