const { fetchAllBrandingDetails } = require('../../systemUser'); // Adjust the path as needed
const systemUser = require('../../../entities/systemUser');
const roleAndPermissions = require('../../../entities/roleAndPermissions');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

jest.mock('../../../entities/systemUser', () => ({
    findAndCountAll: jest.fn(),
}));

describe('fetchAllBrandingDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch branding details with valid parameters', async () => {
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
                    id: 1,
                    name: 'Test User',
                    registeredBy: 'Test Admin',
                    createdAt: '2023-01-15T00:00:00Z',
                },
            ],
            count: 1,
        };

        systemUser.findAndCountAll.mockResolvedValue(mockData);

        const result = await fetchAllBrandingDetails(mockParams);

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

        expect(result).toEqual(mockData);
    });

    it('should handle empty results gracefully', async () => {
        const mockParams = {
            from: null,
            to: null,
            searchText: '',
            sort: 'DESC',
            sortField: 'createdAt',
            limit: 10,
            offset: 0,
        };

        const mockData = { rows: [], count: 0 };

        systemUser.findAndCountAll.mockResolvedValue(mockData);

        const result = await fetchAllBrandingDetails(mockParams);

        expect(systemUser.findAndCountAll).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { registeredBy: { [Op.like]: '%%' } },
                    { '$credential.name$': { [Op.like]: '%%' } },
                ],
            },
            order: [['createdAt', 'DESC']],
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

        expect(result).toEqual(mockData);
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

        await expect(fetchAllBrandingDetails(mockParams)).rejects.toEqual({
            message: 'Something went wrong',
            error: mockError,
        });

        expect(systemUser.findAndCountAll).toHaveBeenCalled();
    });
});
