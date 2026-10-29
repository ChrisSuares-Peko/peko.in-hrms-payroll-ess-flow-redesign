const billerMDM = require('../../../entities/billerMDM');
const { findAllActive } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAll: jest.fn(),
}));

describe('findAllActive', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active billers', async () => {
        const records = [
            { billerId: 'B001', status: 'active' },
            { billerId: 'B002', status: 'active' },
        ];
        billerMDM.findAll.mockResolvedValue(records);
        const result = await findAllActive();
        expect(result).toEqual(records);
        expect(billerMDM.findAll).toHaveBeenCalledWith({ where: { status: 'active' } });
    });

    it('should return empty array when no active billers exist', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        const result = await findAllActive();
        expect(result).toEqual([]);
    });

    it('should throw on DB error', async () => {
        billerMDM.findAll.mockRejectedValue(new Error('DB error'));
        await expect(findAllActive()).rejects.toThrow('DB error');
    });
});
