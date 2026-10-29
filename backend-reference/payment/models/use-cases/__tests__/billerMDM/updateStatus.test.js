const { Op } = require('sequelize');
const billerMDM = require('../../../entities/billerMDM');
const { updateStatus } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    update: jest.fn(),
}));

describe('updateStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update status for multiple billerIds', async () => {
        billerMDM.update.mockResolvedValue([2]);
        await updateStatus(['B001', 'B002'], 'disabled');
        expect(billerMDM.update).toHaveBeenCalledWith(
            { status: 'disabled' },
            { where: { billerId: { [Op.in]: ['B001', 'B002'] } } }
        );
    });

    it('should update status for a single billerId', async () => {
        billerMDM.update.mockResolvedValue([1]);
        await updateStatus(['B001'], 'active');
        expect(billerMDM.update).toHaveBeenCalledWith(
            { status: 'active' },
            { where: { billerId: { [Op.in]: ['B001'] } } }
        );
    });

    it('should throw on DB error', async () => {
        billerMDM.update.mockRejectedValue(new Error('DB error'));
        await expect(updateStatus(['B001'], 'active')).rejects.toThrow('DB error');
    });
});
