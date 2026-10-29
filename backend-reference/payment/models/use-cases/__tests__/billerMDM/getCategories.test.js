const { Op } = require('sequelize');
const billerMDM = require('../../../entities/billerMDM');
const { getCategories } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAll: jest.fn(),
}));

describe('getCategories', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return distinct category names', async () => {
        billerMDM.findAll.mockResolvedValue([
            { billerCategory: 'Electricity' },
            { billerCategory: 'Water' },
            { billerCategory: 'Gas' },
        ]);
        const result = await getCategories();
        expect(result).toEqual(['Electricity', 'Water', 'Gas']);
    });

    it('should query with group and exclude null categories', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        await getCategories();
        expect(billerMDM.findAll).toHaveBeenCalledWith({
            attributes: ['billerCategory'],
            group: ['billerCategory'],
            where: { billerCategory: { [Op.ne]: null } },
        });
    });

    it('should return empty array when no categories exist', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        const result = await getCategories();
        expect(result).toEqual([]);
    });

    it('should throw on DB error', async () => {
        billerMDM.findAll.mockRejectedValue(new Error('DB error'));
        await expect(getCategories()).rejects.toThrow('DB error');
    });
});
