const { brandingExports } = require('../../systemUser'); // Adjust the path as needed
const systemUser = require('../../../entities/systemUser');
const roleAndPermissions = require('../../../entities/roleAndPermissions');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');
const { formattedDateTime } = require('../../../../utils/formatter');

jest.mock('../../../entities/systemUser', () => ({
    findAndCountAll: jest.fn(),
}));

describe('brandingExports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and format branding export data with valid parameters', async () => {
        const mockParams = {
            from: '2023-01-01',
            to: '2023-12-31',
            searchText: 'test',
            sort: 'ASC',
            sortField: 'createdAt',
            limit: 10,
            offset: 0,
        };

        const mockData = {
            rows: [
                {
                    createdAt: '2023-01-15T00:00:00Z',
                    registeredBy: '123',
                    credential: { name: 'Test Partner' },
                    brandingStatus: 1,
                },
            ],
            count: 1,
        };

        systemUser.findAndCountAll.mockResolvedValue(mockData);

        const result = await brandingExports(mockParams);

        expect(systemUser.findAndCountAll).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { registeredBy: { [Op.like]: `%${mockParams.searchText}%` } },
                    { '$credential.name$': { [Op.like]: `%${mockParams.searchText}%` } },
                ],
                createdAt: {
                    [Op.between]: [new Date(mockParams.from), new Date('2023-12-31T18:30:00.000Z')],
                },
            },
            order: [['createdAt', 'ASC']],
            limit: 10,
            offset: 0,
            include: [
                {
                    model: roleAndPermissions,
                    attributes: [],
                    where: { roleName: 'partner' },
                },
                {
                    model: credential,
                    attributes: ['id', 'name'],
                },
            ],
            raw: true,
            nest: true,
        });

        expect(result).toEqual([
            {
                Date: formattedDateTime(mockData.rows[0].createdAt),
                'Partner Name': 'Test Partner',
                'Partner ID': '123',
                "Share Percentage": "Not Available",
                Status: 'Active',
            },
        ]);
    });

    it('should return an empty array if no data matches the criteria', async () => {
        const mockParams = {
            from: '2023-01-01',
            to: '2023-12-31',
            searchText: 'nonexistent',
            sort: 'ASC',
            sortField: 'createdAt',
            limit: 10,
            offset: 0,
        };

        const mockData = { rows: [], count: 0 };

        systemUser.findAndCountAll.mockResolvedValue(mockData);

        const result = await brandingExports(mockParams);

        expect(systemUser.findAndCountAll).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { registeredBy: { [Op.like]: `%${mockParams.searchText}%` } },
                    { '$credential.name$': { [Op.like]: `%${mockParams.searchText}%` } },
                ],
                createdAt: {
                    [Op.between]: [new Date(mockParams.from), new Date('2023-12-31T18:30:00.000Z')],
                },
            },
            order: [['createdAt', 'ASC']],
            limit: 10,
            offset: 0,
            include: [
                {
                    model: roleAndPermissions,
                    attributes: [],
                    where: { roleName: 'partner' },
                },
                {
                    model: credential,
                    attributes: ['id', 'name'],
                },
            ],
            raw: true,
            nest: true,
        });

        expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
        const mockParams = {
            from: '2023-01-01',
            to: '2023-12-31',
            searchText: 'test',
            sort: 'ASC',
            sortField: 'createdAt',
            limit: 10,
            offset: 0,
        };

        const mockError = new Error('Database error');
        systemUser.findAndCountAll.mockRejectedValue(mockError);

        await expect(brandingExports(mockParams)).rejects.toEqual({
            message: 'Something went wrong',
        });

        expect(systemUser.findAndCountAll).toHaveBeenCalled();
    });
});
