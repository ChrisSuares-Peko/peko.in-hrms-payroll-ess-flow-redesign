const billerMDM = require('../../../entities/billerMDM');
const { findByCategory } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAll: jest.fn(),
}));

describe('findByCategory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return billers matching the given category (no status filter)', async () => {
        const records = [
            { billerId: 'B001', billerCategory: 'Water', status: 'active' },
            { billerId: 'B002', billerCategory: 'Water', status: 'disabled' },
        ];
        billerMDM.findAll.mockResolvedValue(records);
        const result = await findByCategory('Water');
        expect(result).toEqual(records);
        expect(billerMDM.findAll).toHaveBeenCalledWith({ where: { billerCategory: 'Water' } });
    });

    it('should return empty array when no billers match', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        const result = await findByCategory('Telecom');
        expect(result).toEqual([]);
    });

    it('should throw on DB error', async () => {
        billerMDM.findAll.mockRejectedValue(new Error('DB error'));
        await expect(findByCategory('Gas')).rejects.toThrow('DB error');
    });
});
