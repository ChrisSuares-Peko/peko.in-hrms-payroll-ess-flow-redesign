const billerMDM = require('../../../entities/billerMDM');
const { findAllDisabled } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAll: jest.fn(),
}));

describe('findAllDisabled', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all disabled billers', async () => {
        const records = [{ billerId: 'B001', status: 'disabled' }];
        billerMDM.findAll.mockResolvedValue(records);
        const result = await findAllDisabled();
        expect(result).toEqual(records);
        expect(billerMDM.findAll).toHaveBeenCalledWith({ where: { status: 'disabled' } });
    });

    it('should return empty array when no disabled billers exist', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        const result = await findAllDisabled();
        expect(result).toEqual([]);
    });

    it('should throw on DB error', async () => {
        billerMDM.findAll.mockRejectedValue(new Error('DB error'));
        await expect(findAllDisabled()).rejects.toThrow('DB error');
    });
});
