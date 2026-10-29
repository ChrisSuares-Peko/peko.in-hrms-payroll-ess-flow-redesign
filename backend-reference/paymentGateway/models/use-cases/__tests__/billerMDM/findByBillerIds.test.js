const { Op } = require('sequelize');
const billerMDM = require('../../../entities/billerMDM');
const { findByBillerIds } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAll: jest.fn(),
}));

describe('findByBillerIds', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return billers matching the given ids', async () => {
        const records = [{ billerId: 'B001' }, { billerId: 'B002' }];
        billerMDM.findAll.mockResolvedValue(records);
        const result = await findByBillerIds(['B001', 'B002']);
        expect(result).toEqual(records);
        expect(billerMDM.findAll).toHaveBeenCalledWith({
            where: { billerId: { [Op.in]: ['B001', 'B002'] } },
        });
    });

    it('should return empty array when no billers match', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        const result = await findByBillerIds(['NONE']);
        expect(result).toEqual([]);
    });

    it('should throw on DB error', async () => {
        billerMDM.findAll.mockRejectedValue(new Error('DB error'));
        await expect(findByBillerIds(['B001'])).rejects.toThrow('DB error');
    });
});
