const billerMDM = require('../../../entities/billerMDM');
const { findAll } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAll: jest.fn(),
}));

describe('findAll', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all billers without filters', async () => {
        const records = [
            { billerId: 'B001', status: 'active' },
            { billerId: 'B002', status: 'disabled' },
        ];
        billerMDM.findAll.mockResolvedValue(records);
        const result = await findAll();
        expect(result).toEqual(records);
        expect(billerMDM.findAll).toHaveBeenCalledWith();
    });

    it('should return empty array when no billers exist', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        const result = await findAll();
        expect(result).toEqual([]);
    });

    it('should throw on DB error', async () => {
        billerMDM.findAll.mockRejectedValue(new Error('DB error'));
        await expect(findAll()).rejects.toThrow('DB error');
    });
});
