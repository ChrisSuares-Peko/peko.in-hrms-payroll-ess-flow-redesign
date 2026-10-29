const billerMDM = require('../../../entities/billerMDM');
const { findByCategory } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAll: jest.fn(),
}));

describe('findByCategory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all billers when category is "all"', async () => {
        const records = [{ billerId: 'B001' }, { billerId: 'B002' }];
        billerMDM.findAll.mockResolvedValue(records);
        const result = await findByCategory('all');
        expect(result).toEqual(records);
        expect(billerMDM.findAll).toHaveBeenCalledWith();
    });

    it('should return all billers when category is "ALL" (case-insensitive)', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        await findByCategory('ALL');
        expect(billerMDM.findAll).toHaveBeenCalledWith();
    });

    it('should return all billers when category is empty string', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        await findByCategory('');
        expect(billerMDM.findAll).toHaveBeenCalledWith();
    });

    it('should return all billers when category is null', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        await findByCategory(null);
        expect(billerMDM.findAll).toHaveBeenCalledWith();
    });

    it('should filter by billerCategory when a specific category is given', async () => {
        const records = [{ billerId: 'B003', billerCategory: 'Electricity' }];
        billerMDM.findAll.mockResolvedValue(records);
        const result = await findByCategory('Electricity');
        expect(result).toEqual(records);
        expect(billerMDM.findAll).toHaveBeenCalledWith({ where: { billerCategory: 'Electricity' } });
    });

    it('should throw on DB error', async () => {
        billerMDM.findAll.mockRejectedValue(new Error('DB error'));
        await expect(findByCategory('Water')).rejects.toThrow('DB error');
    });
});
