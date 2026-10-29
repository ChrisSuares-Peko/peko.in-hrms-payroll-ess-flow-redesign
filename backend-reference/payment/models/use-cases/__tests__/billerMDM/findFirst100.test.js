const billerMDM = require('../../../entities/billerMDM');
const { findFirst100 } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAll: jest.fn(),
}));

describe('findFirst100', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch billers with limit 100', async () => {
        const records = Array.from({ length: 100 }, (_, i) => ({ billerId: `B${i}` }));
        billerMDM.findAll.mockResolvedValue(records);
        const result = await findFirst100();
        expect(result).toEqual(records);
        expect(billerMDM.findAll).toHaveBeenCalledWith({ limit: 100 });
    });

    it('should return empty array when no billers exist', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        const result = await findFirst100();
        expect(result).toEqual([]);
    });

    it('should throw on DB error', async () => {
        billerMDM.findAll.mockRejectedValue(new Error('DB error'));
        await expect(findFirst100()).rejects.toThrow('DB error');
    });
});
