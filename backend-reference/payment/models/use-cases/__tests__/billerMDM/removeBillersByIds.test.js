const { Op } = require('sequelize');
const billerMDM = require('../../../entities/billerMDM');
const { removeBillersByIds } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    destroy: jest.fn(),
}));

describe('removeBillersByIds', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should destroy billers matching the given billerIds', async () => {
        billerMDM.destroy.mockResolvedValue(2);
        await removeBillersByIds(['B001', 'B002']);
        expect(billerMDM.destroy).toHaveBeenCalledWith({
            where: { billerId: { [Op.in]: ['B001', 'B002'] } },
        });
    });

    it('should call destroy even with an empty array', async () => {
        billerMDM.destroy.mockResolvedValue(0);
        await removeBillersByIds([]);
        expect(billerMDM.destroy).toHaveBeenCalledWith({
            where: { billerId: { [Op.in]: [] } },
        });
    });

    it('should throw on DB error', async () => {
        billerMDM.destroy.mockRejectedValue(new Error('DB error'));
        await expect(removeBillersByIds(['B001'])).rejects.toThrow('DB error');
    });
});
