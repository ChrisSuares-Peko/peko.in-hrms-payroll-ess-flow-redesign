const billerMDM = require('../../../entities/billerMDM');
const { findByBillerCategory } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAll: jest.fn(),
}));

describe('findByBillerCategory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return active billers matching the given category', async () => {
        const records = [
            { billerId: 'B001', billerCategory: 'Electricity', status: 'active' },
            { billerId: 'B002', billerCategory: 'Electricity', status: 'active' },
        ];
        billerMDM.findAll.mockResolvedValue(records);
        const result = await findByBillerCategory('Electricity');
        expect(result).toEqual(records);
        expect(billerMDM.findAll).toHaveBeenCalledWith({
            where: { billerCategory: 'Electricity', status: 'active' },
        });
    });

    it('should return empty array when no billers match', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        const result = await findByBillerCategory('Gas');
        expect(result).toEqual([]);
    });

    it('should throw on DB error', async () => {
        billerMDM.findAll.mockRejectedValue(new Error('DB error'));
        await expect(findByBillerCategory('Water')).rejects.toThrow('DB error');
    });
});
