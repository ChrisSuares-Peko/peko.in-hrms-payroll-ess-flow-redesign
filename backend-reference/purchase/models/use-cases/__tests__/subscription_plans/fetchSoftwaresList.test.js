const { fetchSoftwaresList } = require('../../../use-cases/subscription_plans');
const softwares = require('../../../entities/softwares');
const { Op } = require('sequelize');

jest.mock('../../../entities/softwares', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
describe('fetchSoftwaresList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of software that matches the query', async () => {
        const mockQuery = 'TestSoftware';
        const mockSoftwares = [
            { id: 1, name: 'TestSoftware Pro' },
            { id: 2, name: 'TestSoftware Lite' },
        ];

        softwares.findAll.mockResolvedValue(mockSoftwares);

        const result = await fetchSoftwaresList(mockQuery);

        expect(softwares.findAll).toHaveBeenCalledWith({
            where: {
                name: { [Op.like]: `%${mockQuery}%` },
                status: true,
            },
            attributes: ['id', 'name'],
        });
        expect(result).toEqual(mockSoftwares);
    });

    it('should return an empty array if no matching software is found', async () => {
        const mockQuery = 'NonExistentSoftware';
        softwares.findAll.mockResolvedValue([]);

        const result = await fetchSoftwaresList(mockQuery);

        expect(result).toEqual([]);
    });

    it('should handle errors if database query fails', async () => {
        const mockQuery = 'TestSoftware';
        const mockError = new Error('Database error');

        softwares.findAll.mockRejectedValue(mockError);

        await expect(fetchSoftwaresList(mockQuery)).rejects.toThrow('Database error');
    });
});
