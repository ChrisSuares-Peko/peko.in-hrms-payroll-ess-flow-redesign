const billerMDM = require('../../../entities/billerMDM');
const { countAll } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    count: jest.fn(),
}));

describe('countAll', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return total count of billers', async () => {
        billerMDM.count.mockResolvedValue(42);
        const result = await countAll();
        expect(result).toBe(42);
        expect(billerMDM.count).toHaveBeenCalledWith();
    });

    it('should return 0 when no billers exist', async () => {
        billerMDM.count.mockResolvedValue(0);
        const result = await countAll();
        expect(result).toBe(0);
    });

    it('should throw on DB error', async () => {
        billerMDM.count.mockRejectedValue(new Error('DB error'));
        await expect(countAll()).rejects.toThrow('DB error');
    });
});
